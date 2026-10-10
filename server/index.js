const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5001;
const { upload, deleteFile } = require("./utils");
const path = require("path");

const usersApi = require("./apis/usersApi/usersApi");
const affiliatesApi = require("./apis/usersApi/affiliateApi");
const depositsApi = require("./apis/depositsApi/depositsApi");
const withdrawsApi = require("./apis/withdrawsApi/withdrawsApi");
const homeControlApi = require("./apis/homeControlApi/homeControlApi");
const promotionApi = require("./apis/promotionApi/promotionApi");
const categoriesApi = require("./apis/categoriesApi/categoriesApi");
const kycApi = require("./apis/kycApi/kycApi");
const pagesApi = require("./apis/pagesApi/pagesApi");
const paymentNumberApi = require("./apis/paymentNumberApi/paymentNumberApi");
const paymentMethodApi = require("./apis/paymentMethodApi/paymentMethodApi");
const depositPaymentMethodsApi = require("./apis/depositPaymentMethodsApi/depositPaymentMethodsApi");
const depositPromotionsApi = require("./apis/depositPromotionApi/depositPromotionApi");
const depositTransactionsApi = require("./apis/depositTransactionsApi/depositTransactionsApi"); // New router
const adminDepositTransactionsApi = require("./apis/adminDepositTransactionsApi/adminDepositTransactionsApi");
const withdrawPaymentMethodApi = require("./apis/withdrawPaymentMethodApi/withdrawPaymentMethodApi");
const withdrawTransactionsApi = require("./apis/withdrawTransactionsApi/withdrawTransactionsApi");

const gameApi = require("./apis/gameApi/gameApi");
const adminDashboardApi = require("./apis/adminDashboardApi/adminDashboardApi");
const featuresImageApi = require("./apis/featuresImageApi/featuresImageApi");
const themeColorApi = require("./apis/themeColorApi/themeColorApi");
const opayApi = require("./apis/opayApi/opayApi");
const stripeWebhookApi = require("./apis/stripeWebhookApi/stripeWebhookApi");
const socialLinksApi = require("./apis/socialLinksApi/socialLinksApi");

const fs = require("fs");

const corsConfig = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5174",
    `https://${process.env.SITE_URL}`,
    `http://${process.env.SITE_URL}`,
    `http://www.${process.env.SITE_URL}`,
    `www.${process.env.SITE_URL}`,
    `${process.env.SITE_URL}`,
    `https://dstplay.net`,
    `http://dstplay.net`,
    `http://www.dstplay.net`,
    `www.dstplay.net`,
    `gamebaji71.com`,
    `https://dstplay.net`,
    `http://dstplay.net`,
    `http://www.dstplay.net`,
    `www.dstplay.net`,
    `gamebaji71.com`,
    `https://gamebaji71.com`,
    `http://gamebaji71.com`,
    `http://www.gamebaji71.com`,
    `www.gamebaji71.com`,
    `trickboy.xyz`,
    `https://trickboy.xyz`,
    `http://trickboy.xyz`,
    `http://www.trickboy.xyz`,
    `www.melbet99.com`,
    `https://melbet99.com`,
    `http://melbet99.com`,
    `http://melbet99.com`,
    `www.melbet99.com`,
    `www.lclb.net`,
    `https://lclb.net`,
    `http://lclb.net`,
    `http://lclb.net`,
    `www.jstlive.net`,
    `https://jstlive.net`,
    `http://jstlive.net`,
    `http://jstlive.net`,
    `www.jstlive.net`,
    `www.babu666.live`,
    `https://babu666.live`,
    `http://babu666.live`,
    `http://babu666.live`,
    `www.babu666.live`,
    `www.babu666.live`,
    `https://babu666.live`,
    `http://babu666.live`,
    `http://babu666.live`,
    `www.babu666.live`,
    `www.malta99.com`,
    `https://malta99.com`,
    `http://malta99.com`,
    `http://www.malta99.com`,
    `www.gamebaji71.com`,
    `https://gamebaji71.com`,
    `http://gamebaji71.com`,
    `http://www.gamebaji71.com`,

    `www.baji444.online`,
    `https://baji444.online`,
    `http://baji444.online`,
    `http://www.baji444.online`,
    `www.gamebaji71.com`,
    `https://gamebaji71.com`,
    `http://gamebaji71.com`,
    `http://www.gamebaji71.com`,

    `www.baji444.online`,
    `https://baji444.online`,
    `http://baji444.online`,
    `http://www.baji444.online`,

    `www.bajibos.com`,
    `https://bajibos.com`,
    `http://bajibos.com`,
    `http://www.bajibos.com`,
    `https://api.babu88.oracelsoft.com`,
    `https://babu88.oracelsoft.com`,
    `https://api.velki.oracelsoft.com`,
    `https://velki.oracelsoft.com`,
    `https://api.tk999.oracelsoft.com`,
    `https://tk999.oracelsoft.com`,
    `https://oracelsoft.com`,
    "*",
  ],
  credential: true,
  optionSuccessStatus: 200,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
};

// Middlewares
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
// Stripe needs the exact raw request body for signature verification; mount before JSON parsing.
app.use("/stripe/webhook", stripeWebhookApi());
app.use(express.json());
// Parse FormData
app.use(express.urlencoded({ extended: true }));
// MongoDB setup
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Serve static files from the "Uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// The fun-admin Render service is a Node web service, so serve the committed
// React production bundle from the same origin as the API.
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

// Routes for image upload and delete
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.status(200).json({
    message: "File uploaded successfully",
    filePath: `/uploads/images/${req.file.filename}`,
  });
});

app.delete("/delete", async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: "File path not provided" });
  }
  try {
    await deleteFile(filePath);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    // console.log("db connected")

    // Collections
    const usersCollection = client.db("babu88").collection("users");
    const depositsCollection = client.db("babu88").collection("deposits");
    const withdrawsCollection = client.db("babu88").collection("withdraws");
    const promotionCollection = client.db("babu88").collection("promotions");
    const categoriesCollection = client.db("babu88").collection("categories");
    const pagesCollection = client.db("babu88").collection("pages");
    const homeControlsCollection = client
      .db("babu88")
      .collection("homeControls");
    const kycCollection = client.db("babu88").collection("kyc");
    const withdrawPaymentMethodCollection = client
      .db("babu88")
      .collection("withdraw-payment-methods");
    const withdrawTransactionsCollection = client
      .db("babu88")
      .collection("withdrawTransactions");
    const paymentNumberCollection = client
      .db("babu88")
      .collection("payment-numbers");
    const paymentMethodCollection = client
      .db("babu88")
      .collection("payment-methods");
    const depositPaymentMethodCollection = client
      .db("babu88")
      .collection("deposit-payment-methods");
    const depositPromotionsCollection = client
      .db("babu88")
      .collection("depositPromotions");
    const depositTransactionsCollection = client
      .db("babu88")
      .collection("depositTransactions");
    const gamesCollection = client.db("babu88").collection("games");
    const matchesCollection = client.db("babu88").collection("matches");

    const featuresImageCollection = client
      .db("babu88")
      .collection("FeaturesImage");
    const themeColorCollection = client.db("babu88").collection("ThemeColor");
    const socialLinksCollection = client.db("babu88").collection("socialLinks");

    // Add settings (welcomeBonus) collection
    const settingsCollection = client.db("babu88").collection("settings");
    // Attach to app.locals for access in routers
    app.locals.db = client.db("babu88");
    app.locals.settingsCollection = settingsCollection;

    // Create the explicitly configured first admin without exposing a public
    // account-creation endpoint. Render supplies these values securely.
    const bootstrapUsername = process.env.ADMIN_BOOTSTRAP_USERNAME;
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (bootstrapUsername && bootstrapPassword) {
      const existingAdmin = await usersCollection.findOne({
        username: bootstrapUsername,
      });
      if (existingAdmin && existingAdmin.role !== "admin") {
        throw new Error(
          `Refusing to change non-admin user '${bootstrapUsername}' into an admin`
        );
      }
      const passwordHash = await bcrypt.hash(bootstrapPassword, 10);
      await usersCollection.updateOne(
        { username: bootstrapUsername },
        {
          $set: {
            password: passwordHash,
            role: "admin",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      console.log(`Admin bootstrap synchronized for '${bootstrapUsername}'`);
    }

    // APIs
    app.use(
      "/users",
      usersApi(
        usersCollection,
        homeControlsCollection,
        withdrawTransactionsCollection,
        gamesCollection
      )
    );
    app.use(
      "/users",
      affiliatesApi(usersCollection, homeControlsCollection, gamesCollection)
    );
    app.use(
      "/deposits",
      depositsApi(depositsCollection, usersCollection, promotionCollection)
    );
    app.use(
      "/withdraws",
      withdrawsApi(withdrawsCollection, usersCollection, settingsCollection)
    );
    app.use("/home-controls", homeControlApi(homeControlsCollection));
    app.use("/promotions", promotionApi(promotionCollection));
    app.use("/categories", categoriesApi(categoriesCollection));
    app.use("/kyc", kycApi(kycCollection, homeControlsCollection));
    app.use("/pages", pagesApi(pagesCollection));
    app.use("/paymentnumber", paymentNumberApi(paymentNumberCollection));
    app.use("/paymentmethod", paymentMethodApi(paymentMethodCollection));

    app.use(
      "/admin/depositTransactions",
      adminDepositTransactionsApi(
        depositTransactionsCollection,
        usersCollection,
        depositPaymentMethodCollection,
        depositPromotionsCollection
      )
    );

    app.use(
      "/depositPaymentMethod",
      depositPaymentMethodsApi(depositPaymentMethodCollection)
    );
    app.use(
      "/depositPromotions",
      depositPromotionsApi(
        depositPromotionsCollection,
        depositPaymentMethodCollection
      )
    );
    app.use(
      "/depositTransactions",
      depositTransactionsApi(
        depositTransactionsCollection,
        usersCollection,
        depositPaymentMethodCollection,
        depositPromotionsCollection
      )
    ); // আপডেটেড রাউট

    app.use(
      "/withdrawPaymentMethod",
      withdrawPaymentMethodApi(withdrawPaymentMethodCollection)
    );
    app.use(
      "/withdrawTransactions",
      withdrawTransactionsApi(
        withdrawTransactionsCollection,
        usersCollection,
        withdrawPaymentMethodCollection
      )
    );
    app.use(
      "/admin",
      adminDashboardApi(
        usersCollection,
        gamesCollection,
        depositTransactionsCollection,
        withdrawTransactionsCollection
      )
    ); // New router
    app.use("/features-image", featuresImageApi(featuresImageCollection));
    app.use("/theme-color", themeColorApi(themeColorCollection));
    app.use("/social-links", socialLinksApi(socialLinksCollection));

    // Opay API
    app.use("/opay", opayApi(settingsCollection));

    app.use(
      "/games",
      gameApi(
        gamesCollection,
        usersCollection,
        categoriesCollection,
        matchesCollection
      )
    );

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    //  // console.log("Connected to MongoDB!!!✅");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Default route: serve the admin UI when the production bundle is present.
app.get("/", (req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.send("server is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ data: "good" });
});

// Loader config endpoint
app.get("/loader-config", (req, res) => {
  try {
    const filePath = path.join(__dirname, "loader.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const json = JSON.parse(raw || "{}");
      return res.json({ loader: Boolean(json.loader) });
    }
    return res.json({ loader: true });
  } catch (e) {
    return res.json({ loader: true });
  }
});

// React Router entry points must return the SPA document on a direct visit.
app.get(["/admin", "/dashboard", "/dashboard/*"], (req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(503).send("Admin UI is not built");
});

// Serve the customer SPA for direct visits and refreshes of React Router pages.
// Keep API, upload, and static-asset paths out of the fallback so their 404s stay useful.
const nonSpaPrefixes = [
  "/users", "/games", "/categories", "/deposits", "/withdraws",
  "/home-controls", "/promotions", "/kyc", "/pages", "/paymentnumber",
  "/paymentmethod", "/admin", "/depositPaymentMethod", "/depositPromotions",
  "/depositTransactions", "/withdrawPaymentMethod", "/withdrawTransactions",
  "/features-image", "/theme-color", "/social-links", "/opay", "/upload",
  "/delete", "/uploads", "/assets", "/health", "/loader-config",
];

app.get("*", (req, res, next) => {
  if (
    nonSpaPrefixes.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`)
    ) ||
    !req.accepts("html")
  ) {
    return next();
  }

  const indexPath = path.join(clientDist, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return next();
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
