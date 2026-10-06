const express = require("express");

const socialLinksApi = (collection) => {
  const router = express.Router();

  // Get current social links (single document)
  router.get("/", async (req, res) => {
    try {
      const doc = await collection.findOne({});
      res.json(
        doc || {
          facebook: "",
          instagram: "",
          youtube: "",
          twitter: "",
          telegram: "",
          updatedAt: null,
        }
      );
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Upsert social links
  router.put("/", async (req, res) => {
    try {
      const payload = req.body || {};
      const update = {
        $set: {
          facebook: payload.facebook || "",
          instagram: payload.instagram || "",
          youtube: payload.youtube || "",
          twitter: payload.twitter || "",
          telegram: payload.telegram || "",
          updatedAt: new Date(),
        },
      };
      await collection.updateOne({}, update, { upsert: true });
      const doc = await collection.findOne({});
      res.json(doc);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

module.exports = socialLinksApi;
