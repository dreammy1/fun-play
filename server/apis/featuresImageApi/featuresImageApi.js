const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { upload, deleteFile } = require("../../utils");

// Multer storage for APK files
const apkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/apks");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const originalName = file.originalname.replace(/\s/g, "_");
    cb(null, `${timestamp}_${originalName}`);
  },
});

// Multer instance for APK uploads
const uploadApk = multer({
  storage: apkStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /apk/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("APK files only!"));
    }
  },
});

const featuresImageApi = (featuresImageCollection) => {
  const router = express.Router();

  // Initialize features image document
  router.post("/init", async (req, res) => {
    try {
      const existingDoc = await featuresImageCollection.findOne();
      if (existingDoc) {
        return res.status(400).json({ error: "Features image document already exists" });
      }
      const newDoc = {
        featuresImageMobile: { image: "", links: [] },
        featuresImageDesktop: [],
        download: "",
        downloadApk: "",
        publish: "",
        desktop: "",
        jackpotImage: "",
        secondaryBannerImage: "", // New field
        referImage: { image: "", title: "", description: "", btnColor: "", btnTextColor: "", text: "", referTextColor: "" ,link : ""}, // New field
        exclusiveImage: "", // New field
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await featuresImageCollection.insertOne(newDoc);
      res.status(201).json({ message: "Features image document initialized", id: result.insertedId });
    } catch (err) {
      console.error("Error in POST /features-image/init:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get features images
  router.get("/", async (req, res) => {
    try {
      const images = await featuresImageCollection.findOne();
      // Feature banners are optional. Return a stable empty payload when the
      // admin has not configured them yet, so the public homepage does not
      // treat missing optional artwork as an API failure.
      if (!images) {
        return res.status(200).json({
          featuresImageMobile: { image: "", links: [] },
          featuresImageDesktop: [],
          download: "",
          downloadApk: "",
          publish: "",
          desktop: "",
          downloadImageForDesktop: "",
          jackpotImage: "",
          secondaryBannerImage: "",
          referImage: { image: "", title: "", description: "", btnColor: "", btnTextColor: "", text: "", referTextColor: "", link: "" },
          exclusiveImage: "",
        });
      }
      res.status(200).json(images);
    } catch (err) {
      console.error("Error in GET /features-image:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Upload image
  router.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    res.status(200).json({
      message: "Image uploaded successfully",
      filePath: `/uploads/images/${req.file.filename}`,
    });
  });

  // Upload APK
  router.post("/upload-apk", uploadApk.single("apk"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No APK file uploaded" });
    }
    const filePath = `/uploads/apks/${req.file.filename}`;
    res.status(200).json({
      message: "APK uploaded successfully",
      filePath,
    });
  });

  // Update a specific field
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Update data is required" });
    }
    try {
      const result = await featuresImageCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(200).json({ message: "Updated successfully" });
    } catch (err) {
      console.error("Error in PUT /features-image:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  router.delete("/:id/:field", async (req, res) => {
    const { id, field } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    if (!["featuresImageMobile", "download", "downloadApk", "publish", "desktop", "jackpotImage", "secondaryBannerImage", "referImage", "exclusiveImage"].includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }
    try {
      const doc = await featuresImageCollection.findOne({ _id: new ObjectId(id) });
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      let filePath;
      if (field === "featuresImageMobile") {
        filePath = doc.featuresImageMobile.image;
      } else if (field === "referImage") {
        filePath = doc.referImage.image;
      } else {
        filePath = doc[field];
      }
      if (filePath) {
        await deleteFile(filePath);
      }
      const updateData = field === "featuresImageMobile"
        ? { featuresImageMobile: { image: "", links: doc.featuresImageMobile.links } }
        : field === "referImage"
        ? { referImage: { image: "", title: doc.referImage.title, description: doc.referImage.description, btnColor: doc.referImage.btnColor, btnTextColor: doc.referImage.btnTextColor, text: doc.referImage.text, referTextColor: doc.referImage.referTextColor , links: doc.referImage.links } }
        : { [field]: "" };
      const result = await featuresImageCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(200).json({ message: `${field === "downloadApk" ? "APK" : "Image"} deleted successfully` });
    } catch (err) {
      console.error("Error in DELETE /features-image:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};

module.exports = featuresImageApi;