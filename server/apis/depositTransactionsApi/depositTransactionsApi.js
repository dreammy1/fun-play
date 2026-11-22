const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");

const { ObjectId } = require("mongodb");

const fs = require("fs");

module.exports = (
  depositTransactionsCollection,
  usersCollection,
  depositPaymentMethodCollection,
  depositPromotionsCollection
) => {
  const router = express.Router();
  // Create a new deposit transaction
  router.post("/create", async (req, res) => {
    try {
      const { userId, paymentMethodId, amount, promotionId, gateways } =
        req.body;
      const authHeader = req.header("Authorization") || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : "";
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      let authenticatedUserId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!ObjectId.isValid(decoded.userId)) {
          return res.status(401).json({ error: "Invalid customer token" });
        }
        authenticatedUserId = new ObjectId(decoded.userId);
      } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      if (
        userId &&
        (!ObjectId.isValid(userId) ||
          !new ObjectId(userId).equals(authenticatedUserId))
      ) {
        return res.status(403).json({ error: "Customer identity mismatch" });
      }

      let userInputs = {};

      // userInputs পার্স করা
      if (req.body.userInputs && typeof req.body.userInputs === "object") {
        for (const [key, value] of Object.entries(req.body.userInputs)) {
          try {
            userInputs[key] = JSON.parse(value); // JSON স্ট্রিং পার্স করা
          } catch (error) {
            userInputs[key] = value; // যদি JSON না হয়, তাহলে সরাসরি ভ্যালু সেট করা
          }
        }
      }

      const numericAmount = Number(amount);
      if (
        !paymentMethodId ||
        !ObjectId.isValid(paymentMethodId) ||
        !Number.isFinite(numericAmount) ||
        numericAmount < 200
      ) {
        return res
          .status(400)
          .json({ error: "Invalid or missing required fields" });
      }

      // Validate user
      const user = await usersCollection.findOne({ _id: authenticatedUserId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validate payment method
      const paymentMethod = await depositPaymentMethodCollection.findOne({
        _id: new ObjectId(paymentMethodId),
      });
      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      if (
        paymentMethod.status != null &&
        paymentMethod.status !== true &&
        String(paymentMethod.status).toLowerCase() !== "active"
      ) {
        return res.status(400).json({ error: "Payment method is inactive" });
      }
      const configuredGateways = Array.isArray(paymentMethod.gateway)
        ? paymentMethod.gateway
        : [];
      if (!gateways || !configuredGateways.includes(gateways)) {
        return res.status(400).json({ error: "Invalid payment channel" });
      }

      const requiredInputs = (paymentMethod.userInputs || []).filter(
        (input) => input.isRequired === "true" || input.isRequired === true
      );
      const missingInput = requiredInputs.find((input) => {
        const submitted = userInputs[input.name];
        const value =
          submitted &&
          typeof submitted === "object" &&
          Object.prototype.hasOwnProperty.call(submitted, "data")
            ? submitted.data
            : submitted;
        return value == null || String(value).trim() === "";
      });
      if (missingInput) {
        return res.status(400).json({
          error: `Missing required field: ${missingInput.name}`,
        });
      }

      // Validate promotion (if provided)
      let promotion = null;
      if (promotionId) {
        if (!ObjectId.isValid(promotionId)) {
          return res.status(400).json({ error: "Invalid promotion ID" });
        }
        promotion = await depositPromotionsCollection.findOne({
          _id: new ObjectId(promotionId),
        });
        if (!promotion) {
          return res.status(404).json({ error: "Promotion not found" });
        }
      }

      // Generate unique transaction ID
      const transactionId = `D${Date.now()}${Math.floor(
        Math.random() * 10000
      )}`;

      // Prepare transaction document
      const transaction = {
        id: new ObjectId().toString(), // নতুন ID জেনারেট করা
        userId: authenticatedUserId,
        paymentMethod: {
          id: paymentMethod._id.toString(),
          methodNameBD: paymentMethod.methodNameBD,
          agentWalletNumber: paymentMethod.agentWalletNumber,
          gateways: paymentMethod.gateway, // gateway কে gateways হিসেবে সেট করা
          userInputs: paymentMethod.userInputs,
        },
        gateways: gateways,
        promotion: promotion
          ? {
              id: promotion._id.toString(),
              titleBD: promotion.title_bd,
              bonusType:
                promotion.promotion_bonuses?.find(
                  (bonus) =>
                    bonus.payment_method &&
                    bonus.payment_method.toString() === paymentMethodId
                )?.bonus_type || null,
              bonus:
                promotion.promotion_bonuses?.find(
                  (bonus) =>
                    bonus.payment_method &&
                    bonus.payment_method.toString() === paymentMethodId
                )?.bonus || null,
            }
          : null,
        amount: numericAmount,
        userInputs,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Insert transaction into depositTransactions collection
      const result = await depositTransactionsCollection.insertOne(transaction);

      res.status(201).json({
        message: "Deposit transaction created successfully",
        data: {
          id: transaction.id,
          transactionId,
          amount,
          status: "pending",
          createdAt: transaction.createdAt,
        },
      });
    } catch (error) {
      console.error("Error creating deposit transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/auto-payment", async (req, res) => {
    const date = new Date().toISOString().split("T")[0]; // যেমন 2025-10-14
    const dirPath = path.join(__dirname, "../../uploads/auto-payment");
    const filePath = path.join(dirPath, `${date}.json`);

    try {
      // ফোল্ডার না থাকলে তৈরি করো
      await fs.promises.mkdir(dirPath, { recursive: true });

      let existingData = {};

      // ফাইল আগেই থাকলে পুরনো ডেটা পড়ো
      if (fs.existsSync(filePath)) {
        const fileContent = await fs.promises.readFile(filePath, "utf-8");
        existingData = JSON.parse(fileContent || "{}");
      }

      // নতুন ডেটা body থেকে নাও
      const newData = req.body;

      // index বের করো (পুরনো data count অনুযায়ী)
      const currentIndex = Object.keys(existingData).length;
      existingData[`data-${currentIndex}`] = newData;

      // ফাইল লিখে দাও
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(existingData, null, 2)
      );

      res.status(200).json({ message: "Auto payment data added successfully" });
    } catch (err) {
      console.error("Error saving data:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get all deposit transactions for a user
  router.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // console.log("this is user id ",userId);

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      // if (req.user.id !== userId) {
      //   return res.status(403).json({ error: "Forbidden: You can only access your own transactions" });
      // }

      const transactions = await depositTransactionsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json(transactions);
    } catch (err) {
      console.error("Error in GET /depositTransactions/user/:userId:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
