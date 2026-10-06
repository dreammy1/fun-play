// Helper to generate unique referId
function generateReferId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "GMJ";
  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const sendEmail = require("../../emailService");

const usersApi = (
  usersCollection,
  homeControlsCollection,
  withdrawTransactionsCollection,
  gamesCollection
) => {
  const router = express.Router();
  const jwtSecret = process.env.JWT_SECRET;

  // Middleware to validate JWT tokens
  const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader)
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ error: "Access denied. Invalid token format." });

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
  };

  // Redeem refer wallet: merge referWallet into balance if above minWithdraw
  router.post("/redeem-refer-wallet", authenticateToken, async (req, res) => {
    try {
      const userId = req.body.userId;
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.log(user);

      const referWallet = user.referWallet || 0;
      // Get refer bonus config
      const config = await req.app.locals.db
        .collection("settings")
        .findOne({ type: "refer_bonus", active: true });
      const minWithdraw = config?.minWithdraw || 0;
      if (referWallet < minWithdraw) {
        return res.status(400).json({
          success: false,
          message: `You need at least ৳${minWithdraw} to redeem.`,
        });
      }
      // Merge referWallet into balance, set referWallet to 0
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { balance: referWallet }, $set: { referWallet: 0 } }
      );
      return res.json({
        success: true,
        message: `Redeemed ৳${referWallet} to your balance.`,
        amount: referWallet,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  });

  // Admin: Set or update welcome bonus (amount, active)
  // Admin: Set or update refer bonus (amount, active)
  router.post("/admin/set-refer-bonus", async (req, res) => {
    const { amount, active, minWithdraw } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bonus amount" });
    }
    try {
      const result = await req.app.locals.db.collection("settings").updateOne(
        { type: "refer_bonus" },
        {
          $set: {
            amount,
            active: !!active,
            minWithdraw: typeof minWithdraw === "number" ? minWithdraw : 0,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      res.json({ success: true, message: "Refer bonus updated", result });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "DB error", error: err.message });
    }
  });

  // Public: Get refer bonus config
  router.get("/public/refer-bonus", async (req, res) => {
    try {
      const bonus = await req.app.locals.db
        .collection("settings")
        .findOne({ type: "refer_bonus", active: true });
      res.json({ success: true, bonus });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "DB error", error: err.message });
    }
  });

  // Get user by referId
  router.get("/refer/:referId", async (req, res) => {
    const { referId } = req.params;
    if (!referId) return res.status(400).json({ error: "No referId provided" });
    const user = await usersCollection.findOne({ referId });
    if (!user) return res.status(404).json({ error: "Refer user not found" });
    res.json({ success: true, user });
  });

  router.post("/admin/set-welcome-bonus", async (req, res) => {
    const { amount, active } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bonus amount" });
    }
    try {
      const result = await req.app.locals.db.collection("settings").updateOne(
        { type: "welcome_bonus" },
        {
          $set: { amount, active: !!active, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      res.json({ success: true, message: "Welcome bonus updated", result });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "DB error", error: err.message });
    }
  });

  // Public: Get welcome bonus config
  router.get("/public/welcome-bonus", async (req, res) => {
    try {
      const bonus = await req.app.locals.db
        .collection("settings")
        .findOne({ type: "welcome_bonus", active: true });
      res.json({ success: true, bonus });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "DB error", error: err.message });
    }
  });

  // Register a new user (with welcome bonus if active)
  router.post("/register", async (req, res) => {
    const userInfo = req.body;
    if (!userInfo?.username || !userInfo?.password) {
      return res
        .status(400)
        .send({ message: "Username and password are required" });
    }
    try {
      const existingUser = await usersCollection.findOne({
        $or: [{ username: userInfo?.username }, { number: userInfo?.phone }],
      });
      if (existingUser)
        return res.status(400).json({ error: "User already exists" });
      // Generate unique referId
      let referId = userInfo.referId || generateReferId();
      // Ensure referId is unique
      while (await usersCollection.findOne({ referId })) {
        referId = generateReferId();
      }
      const hashedPassword = await bcrypt.hash(userInfo?.password, 10);
      const newUser = {
        ...userInfo,
        password: hashedPassword,
        role: "user",
        balance: 0,
        referId,
        referWallet: 0,
      };
      newUser.createdAt = new Date();
      // Welcome bonus
      const bonus = await req.app.locals.db
        .collection("settings")
        .findOne({ type: "welcome_bonus", active: true });
      if (bonus && bonus.amount > 0) {
        newUser.balance = bonus.amount;
        newUser.welcomeBonusReceived = true;
        newUser.welcomeBonusAmount = bonus.amount;
        newUser.welcomeBonusAt = new Date();
      }
      // Referral bonus logic
      if (userInfo.referralCode) {
        const parent = await usersCollection.findOne({
          referId: userInfo.referralCode,
        });
        if (parent) {
          // Get refer bonus config
          const referBonus = await req.app.locals.db
            .collection("settings")
            .findOne({ type: "refer_bonus", active: true });
          if (referBonus && referBonus.amount > 0) {
            await usersCollection.updateOne(
              { _id: parent._id },
              { $inc: { referWallet: referBonus.amount } }
            );
            newUser.referredBy = parent._id;
            newUser.referBonusAmount = referBonus.amount;
            newUser.referBonusAt = new Date();
          }
        }
      }
      const result = await usersCollection.insertOne(newUser);
      res.status(201).send(result);
    } catch (error) {
      res.status(500).send({ message: "Registration failed" });
    }
  });

  // Register as an agent
  router.post("/agentregistration", async (req, res) => {
    const userInfo = req.body;
    if (!userInfo?.username || !userInfo?.password) {
      return res
        .status(400)
        .send({ message: "Username and password are required" });
    }
    try {
      const existingUser = await usersCollection.findOne({
        username: userInfo?.username,
      });
      if (existingUser)
        return res.status(400).json({ error: "User already exists" });
      const hashedPassword = await bcrypt.hash(userInfo?.password, 10);
      const newUser = {
        ...userInfo,
        password: hashedPassword,
        role: "agent",
        status: "pending",
      };
      newUser.createdAt = new Date();
      const result = await usersCollection.insertOne(newUser);
      // Send Registration Email to the agent
      const emailSubject = "Thanks for Registration";
      const emailText = `Thanks for your registration. Please wait for admin approval. After approval, you will get an confirmation email with further instructions.`;
      await sendEmail(userInfo?.email, emailSubject, emailText);
      res.status(201).send(result);
    } catch (error) {
      res.status(500).send({ message: "Registration failed" });
    }
  });

  // Login a user and validate JWT issuance
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    try {
      const user = await usersCollection.findOne({ username });
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Invalid credentials" });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        jwtSecret,
        { expiresIn: "7d" }
      );

      await usersCollection.updateOne(
        { username },
        { $set: { lastLoginAt: new Date() } },
        { upsert: true }
      );

      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Login a agent and validate JWT issuance
  router.post("/agent/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    try {
      const user = await usersCollection.findOne({ username });
      if (!user)
        return res
          .status(400)
          .json({ error: "Username or password do not match." });

      if (user?.status?.toLowerCase() !== "approve") {
        return res.status(403).json({
          error:
            "Your account is not approved yet. Please wait for approval or check your email.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ error: "Username or password do not match." });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        jwtSecret,
        { expiresIn: "7d" }
      );

      await usersCollection.updateOne(
        { username },
        { $set: { lastLoginAt: new Date() } },
        { upsert: true }
      );

      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ error: "Login failed." });
    }
  });

  // Example Protected Route Using Middleware
  router.get("/profile", authenticateToken, async (req, res) => {
    try {
      const user = await usersCollection.findOne({
        _id: new ObjectId(req.user.userId),
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const pendingTransactions = await withdrawTransactionsCollection
        .find({ userId: new ObjectId(req.user.userId), status: "pending" })
        .toArray();
      const totalPendingAmount = pendingTransactions.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );

      const { password: _, ...userInfo } = user;
      userInfo.balance -= totalPendingAmount;
      userInfo.withdraw += totalPendingAmount;
      res.status(200).json(userInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const result = await usersCollection
        .find({}, { projection: { password: 0 } })
        .toArray();
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch users" });
    }
  });

  // ? get the user balance
  router.post("/get-user-balance", async (req, res) => {
    try {
      const { user_id } = req.body;

      if (!user_id || !ObjectId.isValid(user_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid user_id is required." });
      }

      const user = await usersCollection.findOne(
        { _id: new ObjectId(user_id) },
        { projection: { balance: 1 } }
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found!" });
      }

      res.json({
        success: true,
        data: {
          balance: user.balance || 0,
        },
      });
    } catch (error) {
      console.error("Error in get-user-balance:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Get user game history with game information, sorted by latest playedAt
  router.post("/get-user-game-history", async (req, res) => {
    try {
      const { user_id } = req.body;

      // Validate user_id
      if (!user_id || !ObjectId.isValid(user_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid user_id is required." });
      }

      // Fetch user with game history
      const user = await usersCollection.findOne(
        { _id: new ObjectId(user_id) },
        { projection: { gameHistory: 1, username: 1 } }
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found!" });
      }

      // If no game history, return empty array
      if (!user.gameHistory || user.gameHistory.length === 0) {
        return res.json({
          success: true,
          data: {
            username: user.username,
            gameHistory: [],
          },
        });
      }

      // Sort game history by playedAt in descending order (latest first)
      const sortedGameHistory = user.gameHistory.sort((a, b) => {
        return new Date(b.playedAt) - new Date(a.playedAt);
      });

      // Fetch game details for each game history entry
      const enrichedGameHistory = await Promise.all(
        sortedGameHistory.map(async (history) => {
          const game = await gamesCollection.findOne(
            { gameID: history.gameID },
            { projection: { title: 1, category: 1, subcategory: 1, image: 1 } }
          );

          return {
            ...history,
            gameInfo: game
              ? {
                  title: game.title,
                  category: game.category,
                  subcategory: game.subcategory,
                  image: game.image,
                }
              : null,
          };
        })
      );

      // Return enriched game history
      res.json({
        success: true,
        data: {
          username: user.username,
          gameHistory: enrichedGameHistory,
        },
      });
    } catch (error) {
      console.error("Error in get-user-game-history:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Get all users' game history with game information, sorted by latest playedAt
  router.get("/get-all-users-game-history", async (req, res) => {
    try {
      // Fetch all users with game history
      const users = await usersCollection
        .find(
          { gameHistory: { $exists: true, $ne: [] } },
          { projection: { username: 1, number: 1, gameHistory: 1 } }
        )
        .toArray();

      if (!users || users.length === 0) {
        return res.json({
          success: true,
          data: [],
        });
      }

      // Enrich each user's game history with game details
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          // Sort game history by playedAt in descending order (latest first)
          const sortedGameHistory = user.gameHistory.sort((a, b) => {
            return new Date(b.playedAt) - new Date(a.playedAt);
          });

          // Fetch game details for each game history entry
          const enrichedGameHistory = await Promise.all(
            sortedGameHistory.map(async (history) => {
              const game = await gamesCollection.findOne(
                { gameID: history.gameID },
                {
                  projection: {
                    title: 1,
                    category: 1,
                    subcategory: 1,
                    image: 1,
                  },
                }
              );

              return {
                ...history,
                gameInfo: game
                  ? {
                      title: game.title,
                      category: game.category,
                      subcategory: game.subcategory,
                      image: game.image,
                    }
                  : null,
              };
            })
          );

          return {
            _id: user._id,
            username: user.username,
            number: user.number,
            gameHistory: enrichedGameHistory,
          };
        })
      );

      // Return enriched users with game history
      res.json({
        success: true,
        data: enrichedUsers,
      });
    } catch (error) {
      console.error("Error in get-all-users-game-history:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // get all agents
  router.get("/agent", async (req, res) => {
    try {
      const result = await usersCollection
        .find({ role: "agent" }, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch users" });
    }
  });

  // update status of an agent
  router.put("/updateagentstatus/:id", authenticateToken, async (req, res) => {
    const { id } = req.params; // User ID from the URL parameter

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    const { status, email } = req.body; // New status from the request body
    if (!id || !status) {
      return res.status(400).json({ error: "User ID and status are required" });
    }

    try {
      const validStatuses = ["approve", "reject", "pending"];
      if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid status. Use 'approve', 'reject', or 'pending'.",
        });
      }

      const logoData = await homeControlsCollection.findOne({
        page: "home",
        section: "navbar",
        category: "logo",
        isSelected: true,
      });

      if (!logoData || !logoData?.image) {
        return res
          .status(500)
          .json({ error: "Logo not found in the database" });
      }

      const logoUrl = `${process.env.CLIENT_URL}${logoData.image}`;
      // console.log("logo", logoUrl);

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id), role: "agent" },
        { $set: { status: status.toLowerCase(), updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Send email based on the updated status
      let emailSubject = "";
      let emailText = "";

      if (status.toLowerCase() === "approve") {
        emailSubject = "Your Account has been Approved";
        emailText = `<div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background-color: #4caf50; text-align: center; padding: 20px;">
        <img src="${logoUrl}" alt="Company Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;">
        </div>
        <div style="padding: 20px; color: #333;"
        <h2 style="font-size: 28px; margin-bottom: 10px; font-weight: 700;">Congratulations!</h2>
        <p style="font-size: 16px; line-height: 1.6; margin: 10px 0;">
        We are pleased to inform you that your application has been successfully approved. Thank you for choosing our services, and we are excited to have you onboard!</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 10px 0;">
        If you have any questions or need further assistance, please feel free to contact us.</p>
        <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.AGENT_LOGIN_LINK}" target="_blank" style="display: inline-block; padding: 12px 25px; font-size: 16px; color: white; background-color: #4caf50; text-decoration: none; border-radius: 5px;">
          Please Login
        </a>
        </div>
        </div>
        
        <div style="text-align: center; padding: 15px; background-color: #f4f4f4; font-size: 14px; color: #777;">
        <p style="margin: 5px 0;">
        Need help? <a href="mailto:support@example.com" style="color: #4caf50; text-decoration: none;">Contact Support</a>
        </p>
        <p style="margin: 5px 0;">© 2025 ${process.env.SITE_NAME}. All rights reserved.</p>
        </div>
        </div>`;
      } else if (status.toLowerCase() === "reject") {
        emailSubject = "Your Account has been Rejected";
        emailText = `
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background-color: #f44336; text-align: center; padding: 20px;">
            <img src="${logoUrl}" alt="Company Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;">
          </div>
          <div style="padding: 20px;">
            <p>Unfortunately, your account has been rejected. Please contact our customer support for further assistance.</p>
          </div>
          <div style="text-align: center; margin: 20px;">
            <a href="mailto:support@example.com" style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">Contact Support</a>
          </div>
        </div>
      `;
      }

      if (emailSubject && emailText) {
        await sendEmail(email, emailSubject, emailText);
      }

      res.status(200).json({ message: "User status updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // get a user by ID
  router.get("/single-user/:id", async (req, res) => {
    const { id } = req?.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!id) {
      return;
    }

    const pendingTransactions = await withdrawTransactionsCollection
      .find({ userId: new ObjectId(id), status: "pending" })
      .toArray();
    const totalPendingAmount = pendingTransactions.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );

    const result = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );
    if (result) {
      const userInfo = { ...result };
      userInfo.balance -= totalPendingAmount;
      userInfo.withdraw += totalPendingAmount;

      // console.log("this is balance -> ",result,userInfo );

      res.send(userInfo);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // get a agent by ID
  // router.get("/single-agent/:id", async (req, res) => {
  //   const { id } = req?.params;

  //   if (!ObjectId.isValid(id)) {
  //     return res.status(400).json({ error: "Invalid ID format" });
  //   }

  //   if (!id) {
  //     return;
  //   }
  //   const result = await usersCollection.findOne(
  //     { _id: new ObjectId(id), role: "agent" },
  //     { projection: { password: 0 } }
  //   );
  //   res.send(result);
  // });

  // Update an agent by ID
  router.put("/update-agent/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const updateData = req.body;

      // Validate agent ID
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      // Validate update data
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).send({ message: "No data provided to update" });
      }

      // Handle password updates
      if (updateData.password) {
        if (updateData.password.length < 6) {
          return res
            .status(400)
            .send({ message: "Password must be at least 6 characters long" });
        }
        updateData.password = await bcrypt.hash(updateData.password, 10); // Hash password
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: updateData };

      const result = await usersCollection.updateOne(filter, updateDoc);

      // Check the result of the update operation
      if (result.matchedCount === 0) {
        return res.status(404).send({ message: "Agent not found" });
      }

      if (result.modifiedCount === 0) {
        return res.status(200).send({ message: "No changes were made" });
      }

      res.status(200).send({ message: "Agent updated successfully" });
    } catch (error) {
      console.error("Error updating agent:", error);
      res
        .status(500)
        .send({ message: "Server error. Please try again later." });
    }
  });

  // Update user image by ID
  router.put("/update-user-image/:id", async (req, res) => {
    try {
      const { id } = req.params; // User ID from the URL parameter
      const { profileImage } = req.body; // Image URL or path from the request body

      // Validate the user ID
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Validate the image field
      if (!profileImage || typeof profileImage !== "string") {
        return res.status(400).json({
          error: "Invalid image value. It must be a non-empty string.",
        });
      }

      // Update the user's image field
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { profileImage } } // Update `image` timestamp
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ message: "Profile image updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile image" });
    }
  });

  // Admin can log in as any agent using their username
  router.post("/admin/login-as-agent", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Agent username is required" });
      }

      // Find the agent by username
      const agent = await usersCollection.findOne({ username: username });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (agent.status.toLowerCase() !== "approve") {
        return res
          .status(403)
          .json({ error: "Agent account is not approved yet." });
      }

      // Generate JWT token for the agent (include role in payload)
      const agentToken = jwt.sign(
        { userId: agent._id, username: agent.username, role: "agent" }, // Include role
        jwtSecret,
        { expiresIn: "1d" }
      );

      // Return the agent's login token with role
      res.status(200).json({
        token: agentToken,
        role: "agent", // Send role separately too
        message: "Admin logged in as agent successfully.",
      });
    } catch (error) {
      res.status(500).json({ error: "Login as agent failed." });
    }
  });

  // GET /users - Fetch all users (for admin)
  router.get("/admin/get-users", async (req, res) => {
    try {
      const users = await usersCollection.find().toArray();
      // Remove password field for security
      const sanitizedUsers = users.map((user) => {
        const { password, ...rest } = user;
        return rest;
      });
      res.status(200).json({ data: sanitizedUsers });
    } catch (err) {
      console.error("Error in GET /users:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  });

  // Update user information by ID
  router.put("/admin/update-user/:id", async (req, res) => {
    const { id } = req.params;
    let updateData = req.body;
    // Convert balance to integer if provided
    if (updateData.balance !== undefined) {
      updateData.balance = parseInt(updateData.balance, 10);
      if (isNaN(updateData.balance)) {
        return res
          .status(400)
          .json({ error: "Balance must be a valid number" });
      }
    }

    // testuser ->

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No data provided to update" });
    }

    try {
      // Validate required fields
      if (updateData.username) {
        const existingUser = await usersCollection.findOne({
          username: updateData.username,
          _id: { $ne: new ObjectId(id) },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      if (updateData.number) {
        const existingUser = await usersCollection.findOne({
          number: updateData.number,
          _id: { $ne: new ObjectId(id) },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Number already exists" });
        }
      }

      if (updateData.email && updateData.email !== "") {
        const existingUser = await usersCollection.findOne({
          email: updateData.email,
          _id: { $ne: new ObjectId(id) },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      if (updateData.balance !== undefined && updateData.balance < 0) {
        return res.status(400).json({ error: "Balance cannot be negative" });
      }

      if (updateData.role && !["user", "agent"].includes(updateData.role)) {
        return res
          .status(400)
          .json({ error: "Invalid role. Must be 'user' or 'agent'" });
      }

      if (updateData.password && updateData.password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      const updateDoc = {
        $set: {
          ...updateData,
          updatedAt: new Date(),
          primaryNumber: updateData.number || undefined,
        },
      };

      // Hash password if provided
      if (updateData.password) {
        // const salt = await bcrypt.genSalt(10);
        updateDoc.$set.password = await bcrypt.hash(updateData.password, 10);
      }

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      if (result.modifiedCount === 0) {
        return res.status(200).json({ message: "No changes made" });
      }

      // console.log("Update result:", result);

      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  router.get("/admin/profile/:id", async (req, res) => {
    const { id } = req.params;
    try {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const admin = await usersCollection.findOne({
        _id: new ObjectId(id),
        role: "admin",
      });
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.status(200).json({
        username: admin.username,
        email: admin.email,
        number: admin.number,
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ error: "Failed to fetch admin profile" });
    }
  });

  router.put("/admin/update-profile/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No data provided to update" });
    }

    try {
      if (updateData.username) {
        if (/\s/.test(updateData.username)) {
          return res
            .status(400)
            .json({ error: "Username cannot contain spaces" });
        }
        const existingUser = await usersCollection.findOne({
          username: updateData.username,
          _id: { $ne: new ObjectId(id) },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      if (
        updateData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)
      ) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (updateData.number && !/^\d{10,15}$/.test(updateData.number)) {
        return res
          .status(400)
          .json({ error: "Phone number must be 10-15 digits" });
      }

      if (updateData.password) {
        if (
          updateData.password.length < 6 ||
          !/[a-zA-Z]/.test(updateData.password) ||
          !/[0-9]/.test(updateData.password)
        ) {
          return res.status(400).json({
            error:
              "Password must be at least 6 characters long and contain letters and numbers",
          });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updateDoc = {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      };

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id), role: "admin" },
        updateDoc
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }

      if (result.modifiedCount === 0) {
        return res.status(200).json({ message: "No changes made" });
      }

      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  return router;
};

module.exports = usersApi;
