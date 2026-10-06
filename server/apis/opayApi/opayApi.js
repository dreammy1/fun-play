const express = require("express");
const axios = require("axios");

// Opay API router: validate and persist API key + validation result
// External endpoint: GET http://localhost:5000/api/external/key/validate (header X-API-Key)

module.exports = function opayApi(settingsCollection) {
  const router = express.Router();

  const SETTINGS_KEY = "opay";
  const externalUrl = "https://api.oraclepay.org/api/external/key/validate";

  const getAllowedDomain = () => {
    return process.env.DOMAIN || null;
  };

  const getSettings = async () => {
    if (!settingsCollection) return null;
    return settingsCollection.findOne({ key: SETTINGS_KEY });
  };

  const saveSettings = async (doc) => {
    if (!settingsCollection) return;
    await settingsCollection.updateOne(
      { key: SETTINGS_KEY },
      { $set: { ...doc, key: SETTINGS_KEY, updatedAt: new Date() } },
      { upsert: true }
    );
  };

  // Helper: perform external validation + domain check
  const performValidation = async (apiKey, persistOnMismatch = true) => {
    const response = await axios.get(externalUrl, {
      headers: { "X-API-Key": apiKey },
      timeout: 15000,
    });
    const payload = response.data || {};
    const allowed = getAllowedDomain();
    if (allowed) {
      const domains = Array.isArray(payload.domains) ? payload.domains : [];
      const primary = payload.primaryDomain || "";
      const match = domains.includes(allowed) || primary === allowed;
      if (!match) {
        if (persistOnMismatch) await saveSettings({ apiKey, validation: payload });
        return {
          status: 400,
          body: {
            success: false,
            valid: false,
            reason: payload.reason || "DOMAIN_MISMATCH",
            allowedDomain: allowed,
            domains,
            primaryDomain: primary,
          },
        };
      }
    }
    await saveSettings({ apiKey, validation: payload });
    return { status: 200, body: payload };
  };

  // Return Opay settings; always refresh validation if apiKey exists unless ?cached=true
  router.get("/settings", async (req, res) => {
    try {
      const useCached = req.query.cached === "true";
      const saved = await getSettings();
      let currentValidation = saved?.validation || null;
      if (saved?.apiKey && !useCached) {
        try {
          const result = await performValidation(saved.apiKey, false);
          currentValidation = result.body; // even if mismatch, body contains error structure
          if (result.status === 200) {
            // successful validation already persisted by performValidation
          }
        } catch (e) {
          // leave previous validation if external fails
        }
      }
      return res.status(200).json({
        apiKey: saved?.apiKey || "",
        validation: currentValidation,
        updatedAt: saved?.updatedAt || null,
        running: saved?.running === true,
        refreshed: !useCached && !!saved?.apiKey,
      });
    } catch (err) {
      return res.status(500).json({ success: false, reason: "READ_FAILED", message: err.message });
    }
  });

  // Validate API key (from body or saved), domain-check, then persist
  router.post("/validate", async (req, res) => {
    try {
      let { apiKey } = req.body || {};

      if (!apiKey) {
        const saved = await getSettings();
        apiKey = saved?.apiKey;
      }

      if (!apiKey) {
        return res.status(400).json({ success: false, valid: false, reason: "MISSING_API_KEY" });
      }

      const result = await performValidation(apiKey, true);
      return res.status(result.status).json(result.body);
    } catch (err) {
      if (err.response) {
        const status = err.response.status || 500;
        const data = err.response.data || { success: false, valid: false, reason: "UPSTREAM_ERROR" };
        return res.status(status >= 400 ? 400 : status).json(data);
      }
      return res.status(500).json({ success: false, valid: false, reason: "REQUEST_FAILED", message: err.message });
    }
  });

  // Toggle running status
  router.patch("/running", async (req, res) => {
    try {
      const { running } = req.body || {};
      if (typeof running !== "boolean") {
        return res.status(400).json({ success: false, reason: "INVALID_RUNNING_VALUE" });
      }
      const saved = (await getSettings()) || {};
      await saveSettings({ ...saved, running });
      return res.status(200).json({ success: true, running });
    } catch (err) {
      return res.status(500).json({ success: false, reason: "RUNNING_UPDATE_FAILED", message: err.message });
    }
  });

  // Callback deposit webhook: save payload and credit user balance if success === true
  // Endpoint: POST /opay/callback-deposit
  // Body example documented in server/callback-webhook.md
  router.post("/callback-deposit", async (req, res) => {
    try {
      const db = req.app.locals?.db;
      if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
      }

      const payload = req.body || {};
      const {
        success,
        userIdentifyAddress,
        amount,
        trxid,
      } = payload;

      // Collections
      const opayDepositCol = db.collection("Opay-deposit");
      const usersCol = db.collection("users");

      // Ensure unique index on trxid to avoid duplicates
      try {
        await opayDepositCol.createIndex({ trxid: 1 }, { unique: true, sparse: true });
      } catch (e) {
        // ignore if already exists or cannot be created right now
      }

      // Normalize amount
      const amountNum = typeof amount === "number" ? amount : Number(amount);

      // Save incoming payload first (idempotent on trxid)
      const baseDoc = {
        ...payload,
        receivedAt: new Date(),
        applied: false,
      };

      let insertedId = null;
      try {
        const insertResult = await opayDepositCol.insertOne(baseDoc);
        insertedId = insertResult.insertedId;
      } catch (err) {
        // Duplicate trxid (already processed/recorded)
        if (err && err.code === 11000) {
          // Already recorded; do not apply again
          const existing = await opayDepositCol.findOne({ trxid });
          return res.status(200).json({
            success: true,
            message: "Already recorded",
            applied: !!existing?.applied,
          });
        }
        // Any other error
        return res.status(500).json({ success: false, message: "Failed to record payload", error: err.message });
      }

      // Only apply balance if marked success and required fields are valid
      if (success === true && trxid && userIdentifyAddress && Number.isFinite(amountNum) && amountNum > 0) {
        const user = await usersCol.findOne({ username: userIdentifyAddress });
        if (!user) {
          // Update the record to indicate not applied due to missing user
          await opayDepositCol.updateOne(
            { _id: insertedId },
            { $set: { applied: false, reason: "USER_NOT_FOUND", checkedAt: new Date() } }
          );
          return res.status(404).json({ success: false, message: "User not found", username: userIdentifyAddress });
        }

        // Credit user's balance
        await usersCol.updateOne({ _id: user._id }, { $inc: { balance: amountNum } });

        // Mark this deposit as applied
        await opayDepositCol.updateOne(
          { _id: insertedId },
          {
            $set: {
              applied: true,
              appliedAt: new Date(),
              username: user.username,
              userId: user._id,
              amount: amountNum,
            },
          }
        );

        // Respond success
        return res.status(200).json({ success: true, applied: true, username: user.username, amount: amountNum });
      }

      // If not success or invalid payload, keep record but don't apply
      await opayDepositCol.updateOne(
        { _id: insertedId },
        { $set: { applied: false, reason: "NOT_APPLIED", checkedAt: new Date() } }
      );
      return res.status(200).json({ success: true, applied: false, message: "Recorded but not applied" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
  });

  // List Opay deposits (global or by user) with filters + pagination
  // GET /opay/deposits?username=johndoe&method=bkash&applied=true&trxid=ABC&from=017&dateFrom=2025-11-01&dateTo=2025-11-30&page=1&limit=20
  router.get("/deposits", async (req, res) => {
    try {
      const db = req.app.locals?.db;
      if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
      }
      const { username, method, applied, trxid, from } = req.query;
      const { dateFrom, dateTo, page = "1", limit = "20" } = req.query;

      const col = db.collection("Opay-deposit");
      const and = [];
      if (username) {
        and.push({ $or: [{ username }, { userIdentifyAddress: username }] });
      }
      if (method) {
        and.push({ method });
      }
      if (typeof applied !== "undefined") {
        and.push({ applied: String(applied).toLowerCase() === "true" });
      }
      if (trxid) {
        and.push({ trxid: { $regex: trxid, $options: "i" } });
      }
      if (from) {
        and.push({ from: { $regex: from, $options: "i" } });
      }
      if (dateFrom || dateTo) {
        const range = {};
        if (dateFrom) {
          const start = new Date(dateFrom);
          if (!isNaN(start.getTime())) range.$gte = start;
        }
        if (dateTo) {
          const end = new Date(dateTo);
          if (!isNaN(end.getTime())) {
            // make end inclusive by adding 1 day and using $lt
            const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
            range.$lt = endExclusive;
          }
        }
        if (Object.keys(range).length) and.push({ receivedAt: range });
      }

      const filter = and.length ? { $and: and } : {};
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const sort = { appliedAt: -1, receivedAt: -1 };
      // Aggregation pipeline to join user info
      const pipeline = [
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "users",
            let: { depUsername: "$username", depIdentify: "$userIdentifyAddress" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$username", "$$depUsername"] },
                      { $eq: ["$username", "$$depIdentify"] },
                    ],
                  },
                },
              },
              { $project: { username: 1, balance: 1, number: 1, email: 1 } },
            ],
            as: "userInfo",
          },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      ];

      const [items, total] = await Promise.all([
        col.aggregate(pipeline).toArray(),
        col.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: items,
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + items.length < total,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
  });

  return router;
};
