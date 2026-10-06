const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

module.exports = (depositPromotionsCollection, depositPaymentMethodCollection) => {
  // Helper function to populate payment methods in promotion bonuses
  const populatePaymentMethods = async (promotions) => {
    const paymentMethodIds = new Set();
    promotions.forEach((promotion) => {
      promotion.promotion_bonuses.forEach((bonus) => paymentMethodIds.add(bonus.payment_method.toString()));
    });

    const paymentMethods = await depositPaymentMethodCollection
      .find({ _id: { $in: Array.from(paymentMethodIds).map((id) => new ObjectId(id)) } })
      .toArray();

    const paymentMethodMap = new Map(paymentMethods.map((method) => [method._id.toString(), method]));

    return promotions.map((promotion) => ({
      ...promotion,
      promotion_bonuses: promotion.promotion_bonuses.map((bonus) => ({
        ...bonus,
        payment_method: paymentMethodMap.get(bonus.payment_method.toString()) || { _id: bonus.payment_method },
      })),
    }));
  };

  // Get all deposit promotions
  router.get("/deposit-promotions", async (req, res) => {
    try {
      const promotions = await depositPromotionsCollection.find({}).toArray();
    
      const populatedPromotions = await populatePaymentMethods(promotions);
      res.status(200).json({
        message: "Deposit promotions retrieved successfully",
        data: populatedPromotions,
      });
    } catch (error) {
      console.error("Error fetching deposit promotions:", error);
      res.status(500).json({ error: "Failed to retrieve deposit promotions: " + error.message });
    }
  });

  // Get a single deposit promotion by ID
  router.get("/deposit-promotion/:id", async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid promotion ID" });
      }
      const promotion = await depositPromotionsCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!promotion) {
        return res.status(404).json({ error: "Deposit promotion not found" });
      }
      const populatedPromotions = await populatePaymentMethods([promotion]);
      res.status(200).json({
        message: "Deposit promotion retrieved successfully",
        data: populatedPromotions[0],
      });
    } catch (error) {
      console.error("Error fetching deposit promotion:", error);
      res.status(500).json({ error: "Failed to retrieve deposit promotion: " + error.message });
    }
  });

  // Create a new deposit promotion
  router.post("/deposit-promotion", async (req, res) => {
    try {
    //  // console.log("Incoming request body:", req.body); // Debug log

      const { title, title_bd, description, description_bd, promotion_bonuses, img } = req.body;

      // console.log("Received data:", req.body);
      

      // Validate required fields with specific errors
      if (!title) {
        return res.status(400).json({ error: "Title (EN) is required" });
      }
      if (!title_bd) {
        return res.status(400).json({ error: "Title (BD) is required" });
      }
      if (!img) {
        return res.status(400).json({ error: "Promotion image is required" });
      }
      if (!promotion_bonuses) {
        return res.status(400).json({ error: "Promotion bonuses are required" });
      }

      let parsedPromotionBonuses;
      try {
        parsedPromotionBonuses = JSON.parse(promotion_bonuses);
        if (!Array.isArray(parsedPromotionBonuses)) {
          return res.status(400).json({ error: "promotion_bonuses must be an array" });
        }
        if (parsedPromotionBonuses.length === 0) {
          return res.status(400).json({ error: "At least one promotion bonus is required" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON format for promotion_bonuses: " + error.message });
      }

      // Validate promotion bonuses
      for (const bonus of parsedPromotionBonuses) {
        if (!bonus.payment_method || !ObjectId.isValid(bonus.payment_method)) {
          return res.status(400).json({ error: "Each bonus must have a valid payment_method ObjectId" });
        }
        if (!["Fix", "Percentage"].includes(bonus.bonus_type)) {
          return res.status(400).json({ error: "bonus_type must be either 'Fix' or 'Percentage'" });
        }
        if (typeof bonus.bonus !== "number" || bonus.bonus < 0) {
          return res.status(400).json({ error: "bonus must be a non-negative number" });
        }
      }

      // Validate payment methods exist
      const bonusPaymentMethodIds = parsedPromotionBonuses.map((bonus) => new ObjectId(bonus.payment_method));
      const validBonusPaymentMethods = await depositPaymentMethodCollection
        .find({ _id: { $in: bonusPaymentMethodIds } })
        .toArray();
      if (validBonusPaymentMethods.length !== bonusPaymentMethodIds.length) {
        return res.status(400).json({ error: "One or more bonus payment methods are invalid" });
      }

      const promotion = {
        img,
        title,
        title_bd,
        description: description || "",
        description_bd: description_bd || "",
        promotion_bonuses: parsedPromotionBonuses.map((bonus) => ({
          payment_method: new ObjectId(bonus.payment_method),
          bonus_type: bonus.bonus_type,
          bonus: bonus.bonus,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await depositPromotionsCollection.insertOne(promotion);
      promotion._id = result.insertedId;

      res.status(201).json({
        message: "Deposit promotion created successfully",
        data: promotion,
      });
    } catch (error) {
      console.error("Error creating deposit promotion:", error);
      res.status(500).json({ error: "Failed to create deposit promotion: " + error.message });
    }
  });

  // Update a deposit promotion
  router.put("/deposit-promotion/:id", async (req, res) => {
    try {
      // console.log("Incoming request body:", req.body); // Debug log

      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid promotion ID" });
      }

      const { title, title_bd, description, description_bd, promotion_bonuses, img } = req.body;

      // Validate required fields with specific errors
      if (!title) {
        return res.status(400).json({ error: "Title (EN) is required" });
      }
      if (!title_bd) {
        return res.status(400).json({ error: "Title (BD) is required" });
      }
      if (!img) {
        return res.status(400).json({ error: "Promotion image is required" });
      }
      if (!promotion_bonuses) {
        return res.status(400).json({ error: "Promotion bonuses are required" });
      }

      let parsedPromotionBonuses;
      try {
        parsedPromotionBonuses = JSON.parse(promotion_bonuses);
        if (!Array.isArray(parsedPromotionBonuses)) {
          return res.status(400).json({ error: "promotion_bonuses must be an array" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON format for promotion_bonuses: " + error.message });
      }

      // Validate promotion bonuses
      for (const bonus of parsedPromotionBonuses) {
        if (!bonus.payment_method || !ObjectId.isValid(bonus.payment_method)) {
          return res.status(400).json({ error: "Each bonus must have a valid payment_method ObjectId" });
        }
        if (!["Fix", "Percentage"].includes(bonus.bonus_type)) {
          return res.status(400).json({ error: "bonus_type must be either 'Fix' or 'Percentage'" });
        }
        if (typeof bonus.bonus !== "number" || bonus.bonus < 0) {
          return res.status(400).json({ error: "bonus must be a non-negative number" });
        }
      }

      // Validate payment methods exist
      const bonusPaymentMethodIds = parsedPromotionBonuses.map((bonus) => new ObjectId(bonus.payment_method));
      const validBonusPaymentMethods = await depositPaymentMethodCollection
        .find({ _id: { $in: bonusPaymentMethodIds } })
        .toArray();
      if (validBonusPaymentMethods.length !== bonusPaymentMethodIds.length) {
        return res.status(400).json({ error: "One or more bonus payment methods are invalid" });
      }

      const updateData = {
        img,
        title,
        title_bd,
        description: description || "",
        description_bd: description_bd || "",
        promotion_bonuses: parsedPromotionBonuses.map((bonus) => ({
          payment_method: new ObjectId(bonus.payment_method),
          bonus_type: bonus.bonus_type,
          bonus: bonus.bonus,
        })),
        updatedAt: new Date(),
      };

      const result = await depositPromotionsCollection.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

      if (!result.value) {
        return res.status(404).json({ error: "Deposit promotion not found" });
      }

      res.status(200).json({
        message: "Deposit promotion updated successfully",
        data: result.value,
      });
    } catch (error) {
      console.error("Error updating deposit promotion:", error);
      res.status(500).json({ error: "Failed to update deposit promotion: " + error.message });
    }
  });

  // Delete a deposit promotion
  router.delete("/deposit-promotion/:id", async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid promotion ID" });
      }
      const result = await depositPromotionsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Deposit promotion not found" });
      }
      res.status(200).json({ message: "Deposit promotion deleted successfully" });
    } catch (error) {
      console.error("Error deleting deposit promotion:", error);
      res.status(500).json({ error: "Failed to delete deposit promotion: " + error.message });
    }
  });

  return router;
};