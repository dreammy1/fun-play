const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const createDepositPaymentMethodsApi = (depositPaymentMethodCollection) => {
 // // console.log("this is inside the api");

  // POST: Create a new deposit payment method
  router.post("/deposit-method", async (req, res) => {
   // // console.log("this is inside the api", req.body);

    try {
      const {
        methodNameEN,
        methodNameBD,
        agentWalletNumber,
        agentWalletText,
        methodImage,
        gateway,
        color,
        userInputs,
        paymentPageImage,
        instructionEN,
        instructionBD,
        status,
        backgroundColor,
        buttonColor,
      } = req.body;

      // Validate required fields
      if (
        !methodNameEN ||
        !methodNameBD ||
        !agentWalletNumber ||
        !agentWalletText ||
        !methodImage ||
        !backgroundColor ||
        !color ||
        !buttonColor
      ) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided" });
      }

      // Prepare the document
      const depositMethod = {
        methodNameEN,
        methodNameBD,
        agentWalletNumber,
        agentWalletText,
        methodImage,
        gateway: gateway || [],
        color: color || "",
        userInputs: userInputs || [],
        paymentPageImage: paymentPageImage || "",
        instructionEN: instructionEN || "",
        instructionBD: instructionBD || "",
        status: status || "active",
        backgroundColor,
        color,
        buttonColor,
        createdAt: new Date(),
      };

      // Insert into MongoDB
      const result = await depositPaymentMethodCollection.insertOne(
        depositMethod
      );

      res.status(201).json({
        message: "Deposit method created successfully",
        data: { _id: result.insertedId, ...depositMethod },
      });
    } catch (error) {
      console.error("Error creating deposit method:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET: Retrieve all deposit payment methods
  router.get("/deposit-methods", async (req, res) => {
    try {
      const depositMethods = await depositPaymentMethodCollection
        .find({})
        .toArray();
      res.status(200).json({
        message: "Deposit methods retrieved successfully",
        data: depositMethods,
      });
    } catch (error) {
      console.error("Error retrieving deposit methods:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET: Retrieve a single deposit payment method by ID
  router.get("/deposit-method/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const depositMethod = await depositPaymentMethodCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!depositMethod) {
        return res.status(404).json({ error: "Deposit method not found" });
      }

      res.status(200).json({
        message: "Deposit method retrieved successfully",
        data: depositMethod,
      });
    } catch (error) {
      console.error("Error retrieving deposit method:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT: Update a deposit payment method by ID
  router.put("/deposit-method/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const {
        methodNameEN,
        methodNameBD,
        agentWalletNumber,
        agentWalletText,
        methodImage,
        gateway,
        color,
        userInputs,
        paymentPageImage,
        instructionEN,
        instructionBD,
        status,
        backgroundColor,
        buttonColor,
      } = req.body;

      // Validate required fields
      if (
        !methodNameEN ||
        !methodNameBD ||
        !agentWalletNumber ||
        !agentWalletText ||
        !methodImage ||
        !backgroundColor ||
        !color ||
        !buttonColor
      ) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided" });
      }

      // Prepare the updated document
      const updatedDepositMethod = {
        methodNameEN,
        methodNameBD,
        agentWalletNumber,
        agentWalletText,
        methodImage,
        gateway: gateway || [],
        color: color || "",
        userInputs: userInputs || [],
        paymentPageImage: paymentPageImage || "",
        instructionEN: instructionEN || "",
        instructionBD: instructionBD || "",
        status: status || "active",
        backgroundColor,
        color,
        buttonColor,
        updatedAt: new Date(),
      };

      // Update in MongoDB
      const result = await depositPaymentMethodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedDepositMethod }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Deposit method not found" });
      }

      res.status(200).json({
        message: "Deposit method updated successfully",
        data: { _id: id, ...updatedDepositMethod },
      });
    } catch (error) {
      console.error("Error updating deposit method:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE: Delete a deposit payment method by ID
  router.delete("/deposit-method/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const result = await depositPaymentMethodCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Deposit method not found" });
      }

      res.status(200).json({
        message: "Deposit method deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting deposit method:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};

module.exports = createDepositPaymentMethodsApi;
