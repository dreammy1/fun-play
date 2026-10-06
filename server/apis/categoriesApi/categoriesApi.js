const express = require("express");
const { ObjectId } = require("mongodb");
const { deleteFile } = require("../../utils");
const axios = require("axios");

const categoriesApi = (categoriesCollection) => {
  const router = express.Router();

  // Get all user-created providers (distinct provider IDs from categories)
  router.get("/providers", async (req, res) => {
    try {
      const providers = await categoriesCollection.find({}).toArray();

      const { data: providerData } = await axios.get(
        "https://apigames.oracleapi.net/api/providers",
        {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        }
      );

      const allProviders = providerData.success ? providerData.data : [];

      const result = providers.map((item) => {
        const found = allProviders.find((p) => p._id === item.provider);
        return found
          ? { ...item, providerName: found.name }
          : { ...item, providerName: item.provider };
      });

      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error fetching user providers:", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch providers" });
    }
  });

  // Add a category data
  router.post("/", async (req, res) => {
    const categoryInfo = req.body;
    categoryInfo.createdAt = new Date();

    if (
      !categoryInfo.image ||
      !categoryInfo.iconImage ||
      !categoryInfo.category ||
      !categoryInfo.provider
    ) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const subcategoryDoc = {
      image: categoryInfo.image,
      iconImage: categoryInfo.iconImage,
      category: categoryInfo.category,
      provider: categoryInfo.provider,
      createdAt: categoryInfo.createdAt,
    };
    const result = await categoriesCollection.insertOne(subcategoryDoc);
    res.send(result);
  });

  // Get all category data with provider info
  router.get("/", async (req, res) => {
    try {
      const { data: providerData } = await axios.get(
        "https://apigames.oracleapi.net/api/providers",
        {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        }
      );

      const providers = providerData.success ? providerData.data : [];

      const subcategories = await categoriesCollection.find().toArray();
      const result = subcategories.map((subcat) => {
        const provider = providers.find((p) => p._id === subcat.provider);
        return {
          ...subcat,
          provider: provider || subcat.provider,
        };
      });
      res.send(result);
    } catch (err) {
      console.error("Error:", err.message);
      res.status(500).json({
        message: "Failed to fetch subcategories with providers",
        categories: await categoriesCollection.find().toArray(),
        error: err.message,
      });
    }
  });

  // Update a category
  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const query = { _id: new ObjectId(id) };

    try {
      const category = await categoriesCollection.findOne(query);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const updateFields = {};
      if (updateData.image) updateFields.image = updateData.image;
      if (updateData.iconImage) updateFields.iconImage = updateData.iconImage;
      if (updateData.category) updateFields.category = updateData.category;
      if (updateData.provider) updateFields.provider = updateData.provider;

      if (Object.keys(updateFields).length === 0) {
        return res
          .status(400)
          .json({ message: "No valid fields provided for update" });
      }

      const result = await categoriesCollection.updateOne(query, {
        $set: updateFields,
      });
      if (result.modifiedCount === 0) {
        return res
          .status(400)
          .json({ message: "No changes made to the category" });
      }
      res.send(result);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  });

  // Delete a category
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const query = { _id: new ObjectId(id) };
    const category = await categoriesCollection.findOne(query);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    try {
      if (category.image) await deleteFile(category.image);
      if (category.iconImage) await deleteFile(category.iconImage);

      const result = await categoriesCollection.deleteOne(query);
      res.send(result);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  });

  return router;
};

module.exports = categoriesApi;
