const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

module.exports = (
  withdrawTransactionsCollection,
  usersCollection,
  withdrawPaymentMethodCollection
) => {
  // Create a new withdraw transaction (POST)
  router.post("/", async (req, res) => {
    // console.log("this is withdraw -> ", req.body);

    try {
      const {
        userId,
        paymentMethod,
        channel,
        amount,
        userInputs,
        status = "pending",
      } = req.body;

      // Validate required fields
      if (!userId || !paymentMethod || !amount || !userInputs) {
        return res.status(400).json({ error: "Required fields are missing" });
      }

      // Validate ObjectId
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Validate payment method
      if (!paymentMethod.methodName || !paymentMethod.methodImage) {
        return res
          .status(400)
          .json({ error: "Payment method details are missing" });
      }

      // Validate amount
      if (amount < 800 || amount > 30000) {
        return res
          .status(400)
          .json({ error: "Amount must be between ৳800 and ৳30,000" });
      }

      // Validate userInputs
      const method = await withdrawPaymentMethodCollection.findOne({
        methodName: paymentMethod.methodName,
      });
      if (!method) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      for (const input of userInputs) {
        if (!["text", "number", "file"].includes(input.type)) {
          return res.status(400).json({ error: "Invalid user input type" });
        }
        if (!input.name || !input.value || !input.label || !input.labelBD) {
          return res
            .status(400)
            .json({ error: "User input details are missing" });
        }
        const requiredInput = method.userInputs.find(
          (i) => i.name === input.name && i.isRequired === "true"
        );
        if (requiredInput && !input.value) {
          return res
            .status(400)
            .json({ error: `Required field ${input.label} is missing` });
        }
      }

      // Check user balance
      let user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.balance < amount) {
        return res.status(400).json({
          error:
            "The withdrawal amount exceeds the available balance in the user's account.",
        });
      }

      // Validate status
      if (!["pending", "completed", "failed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      if (["failed", "cancelled"].includes(status) && !req.body.reason) {
        return res
          .status(400)
          .json({ error: "Reason is required for failed or cancelled status" });
      }

      const newTransaction = {
        userId: new ObjectId(userId),
        paymentMethod: {
          methodName: paymentMethod.methodName,
          methodImage: paymentMethod.methodImage,
          gateway: paymentMethod.gateway || "",
        },
        channel: channel || "",
        amount,
        userInputs,
        status,
        reason: req.body.reason || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await withdrawTransactionsCollection.insertOne(
        newTransaction
      );

      // user = user.withdraw ? user.withdraw : 0;

      // await usersCollection.updateOne(
      //   { _id: new ObjectId(userId) },
      //   { $inc: { withdraw: user.withdraw + amount, balance: -amount } }
      // );

      res.status(201).json({
        message: "Withdraw transaction created",
        data: { insertedId: result.insertedId },
      });
    } catch (err) {
      console.error("Error in POST /withdrawTransactions:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const transactions = await withdrawTransactionsCollection
        .aggregate([
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
              _id: 1,
              userId: 1,
              paymentMethod: 1,
              channel: 1,
              amount: 1,
              userInputs: 1,
              status: 1,
              reason: 1,
              createdAt: 1,
              updatedAt: 1,
              userInfo: {
                username: 1,
                number: 1,
                role: 1,
                balance: 1,
                deposit: 1,
                createdAt: 1,
                lastLoginAt: 1,
              },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
        ])
        .toArray();
      res.status(200).json(transactions);
    } catch (err) {
      console.error("Error in GET /withdrawTransactions:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update transaction status (PATCH)
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // Validate ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      // Validate status
      if (!["completed", "cancelled"].includes(status)) {
        return res
          .status(400)
          .json({
            error: "Invalid status value. Must be 'completed' or 'cancelled'",
          });
      }
      if (status === "cancelled" && !reason) {
        return res
          .status(400)
          .json({ error: "Reason is required for cancelled status" });
      }

      // Find transaction
      const transaction = await withdrawTransactionsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Prevent updates if already completed
      if (transaction.status === "completed") {
        return res
          .status(400)
          .json({
            error: "Transaction already completed and cannot be modified",
          });
      }

      // Update transaction
      const updateData = {
        status,
        reason: reason || "",
        updatedAt: new Date(),
      };

      const result = await withdrawTransactionsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      // Deduct balance if status is completed
      if (result.modifiedCount === 1 && status === "completed") {
        const user = await usersCollection.findOne({
          _id: new ObjectId(transaction.userId),
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        if (user.balance < transaction.amount) {
          return res.status(400).json({
            error: "Insufficient balance to complete withdrawal",
          });
        }

        // console.log("0000000000000000000", user);

        await usersCollection.updateOne(
          { _id: new ObjectId(transaction.userId) },
          {
            $inc: {
              balance: -transaction.amount,
              withdraw: +parseFloat(transaction.amount),
            },
          }
        );
      }

      res.status(200).json({
        message: "Transaction status updated",
        data: { modifiedCount: result.modifiedCount },
      });
    } catch (err) {
      console.error("Error in PATCH /withdrawTransactions:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a transaction (DELETE)
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      // Find transaction
      const transaction = await withdrawTransactionsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Prevent deletion if already completed
      if (transaction.status === "completed") {
        return res
          .status(400)
          .json({ error: "Completed transaction cannot be deleted" });
      }

      // Delete transaction
      const result = await withdrawTransactionsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Transaction deleted" });
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    } catch (err) {
      console.error("Error in DELETE /withdrawTransactions:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get all withdraw transactions for a user
  router.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      // if (req.user.id !== userId) {
      //   return res.status(403).json({ error: "Forbidden: You can only access your own transactions" });
      // }

      const transactions = await withdrawTransactionsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json(transactions);
    } catch (err) {
      console.error("Error in GET /withdrawTransactions/user/:userId:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
