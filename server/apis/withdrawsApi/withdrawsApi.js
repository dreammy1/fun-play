const express = require("express");
const { ObjectId } = require("mongodb");

const withdrawsApi = (
  withdrawsCollection,
  usersCollection,
  settingsCollection
) => {
  const router = express.Router();

  // Get withdraw settings
  router.get("/settings", async (req, res) => {
    try {
      let settings = await settingsCollection.findOne({
        name: "withdrawSettings",
      });
      if (!settings) {
        // Default settings if not found
        settings = {
          name: "withdrawSettings",
          minWithdraw: 0,
        };
      }
      res.json({ success: true, settings });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch settings." });
    }
  });

  // Update withdraw settings
  router.post("/settings", async (req, res) => {
    try {
      const { minWithdraw } = req.body;
      const updatedSettings = {
        $set: {
          minWithdraw: Number(minWithdraw),
        },
      };
      const result = await settingsCollection.updateOne(
        { name: "withdrawSettings" },
        updatedSettings,
        { upsert: true }
      );
      res.json({ success: true, result });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to update settings." });
    }
  });

  //   add a deposit
  router.post("/", async (req, res) => {
    const withdrawInfo = req.body;
    withdrawInfo.status = "pending";
    withdrawInfo.createdAt = new Date();
    // Decrement the user's balance

    await usersCollection.updateOne(
      { _id: new ObjectId(withdrawInfo.userId) },
      { $inc: { balance: -withdrawInfo.amount } }
    );
    const result = await withdrawsCollection.insertOne(withdrawInfo);
    res.send(result);
  });

  //   get all deposits
  router.get("/", async (req, res) => {
    try {
      const result = await withdrawsCollection
        .aggregate([
          {
            $addFields: {
              userId: { $toObjectId: "$userId" },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userInfo",
            },
          },
          {
            $unwind: {
              path: "$userInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              "userInfo.password": 0,
            },
          },
        ])
        .toArray();

      res.send(result);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      res.status(500).send({ error: "Failed to fetch deposits" });
    }
  });

  //   status updated
  router.patch("/status/:id", async (req, res) => {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const { status, reason } = req.body;
    const updatedDoc = { $set: { status, reason } };
    const result = await withdrawsCollection.updateOne(query, updatedDoc);
    res.send(result);
  });

  // delete a withdraw
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const result = await withdrawsCollection.deleteOne(query);
    res.send(result);
  });
  return router;
};
module.exports = withdrawsApi;
