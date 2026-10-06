// ...existing code...
const express = require("express");
const { ObjectId } = require("mongodb");
const { default: axios } = require("axios");
const qs = require("qs");
const path = require("path");
const fs = require("fs");


const gameApi = (
  gamesCollection,
  usersCollection,
  categoriesCollection,
  matchesCollection
) => {
  const router = express.Router();

  // Get all games from DB, enrich with premium API, and return merged data
  // router.get("/merged", async (req, res) => {
  //   try {
  //     // 1. Fetch all games from DB
  //     const dbGames = await gamesCollection.find().toArray();
  //     if (!dbGames.length) {
  //       return res.json({ success: true, count: 0, data: [] });
  //     }

  //     console.log("dbGames:", dbGames);

  //     // 2. Collect all gameIDs
  //     const gameIDs = dbGames.map((g) => g.gameID).filter(Boolean);
  //     if (!gameIDs.length) {
  //       return res.json({ success: true, count: 0, data: [] });
  //     }
  //     // 3. POST to premium API to get full game data
  //     const apiRes = await axios.post(
  //       "https://apigames.oracleapi.net/api/games/by-ids",
  //       { ids: gameIDs },
  //       {
  //         headers: {
  //           "x-api-key":
  //             "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     const premiumData =
  //       apiRes.data && Array.isArray(apiRes.data.data) ? apiRes.data.data : [];
  //     // 4. Merge premium data with DB fields (image/hot/new)
  //     const merged = premiumData.map((premiumGame) => {
  //       const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
  //       return {
  //         ...premiumGame,
  //         image: dbGame?.image || premiumGame.image,
  //         hot: dbGame?.hot || false,
  //         new: dbGame?.new || false,
  //       };
  //     });
  //     res.json({ success: true, count: merged.length, data: merged });
  //   } catch (err) {
  //     console.error("Error in /games/merged", err.message);
  //     res.status(500).json({ success: false, error: "Failed to merge games" });
  //   }
  // });
  router.get("/merged", async (req, res) => {
    try {
      // 1. Fetch all games from DB
      const dbGames = await gamesCollection.find().limit(200).toArray();
      if (!dbGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }

      console.log("dbGames:", dbGames);

      // 2. Collect all gameIDs
      const gameIDs = dbGames.map((g) => g.gameID).filter(Boolean);
      if (!gameIDs.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. POST to premium API to get full game data
      const apiRes = await axios.post(
        "https://apigames.oracleapi.net/api/games/by-ids",
        { ids: gameIDs },
        {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
            "Content-Type": "application/json",
          },
        }
      );
      const premiumData =
        apiRes.data && Array.isArray(apiRes.data.data)
          ? apiRes.data.data.slice(0, 300)
          : [];
      // 4. Merge premium data with DB fields (image/hot/new)
      const merged = premiumData.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
          lobby: dbGame?.lobby || false,
          selected: dbGame?.selected || false,
        };
      });
      res.json({ success: true, count: merged.length, data: merged });
    } catch (err) {
      console.error("Error in /games/merged", err.message);
      res.status(500).json({ success: false, error: "Failed to merge games" });
    }
  });

  // Get games by category value (for category filter)
  router.get("/by-category/:categoryValue", async (req, res) => {
    const { categoryValue } = req.params;

    console.log("categoryValue:", categoryValue);

    try {
      // 1. Find the category in the categories collection

      let categoryDocs = null;
      if (categoriesCollection) {
        categoryDocs = await categoriesCollection
          .find({
            category: categoryValue,
          })
          .toArray();
      } else {
        // fallback: try to get from gamesCollection if categoriesCollection not available
        categoryDocs = await gamesCollection
          .find({
            category: categoryValue,
          })
          .toArray();
      }

      console.log("categoryDocs:", categoryDocs);

      if (!categoryDocs || !categoryDocs[0].provider) {
        return res
          .status(404)
          .json({ success: false, error: "Category or provider not found" });
      }

      const providerIds = categoryDocs
        .map((doc) => doc.provider)
        .filter(Boolean);

      // 2. Fetch all games for these providers from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });

      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);

      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }

      // 3. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);

      // 4. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );

      // 5. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
          lobby : dbGame?.lobby || false,
        };
      });

      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/by-category/:categoryValue", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch games by category" });
    }
  });

  // Get premium game_uuid by local DB _id
  router.get("/premium/:id", async (req, res) => {
    const { id } = req.params;

    console.log("id:", id);

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid game id" });
    }
    try {
      // 1. Find the game in your DB
      const localGame = await gamesCollection.findOne({
        gameID: id,
      });

      // console.log("localGame: 1", localGame);
      if (!localGame || !localGame.gameID) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found in DB" });
      }

      // 2. Fetch the game from premium API by gameID
      const apiKey =
        "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379"; // or your config
      const response = await axios.get(
        `https://apigames.oracleapi.net/api/games/${localGame.gameID}`,
        { headers: { "x-api-key": apiKey } }
      );
      const premiumGame = response.data?.data;

      if (!premiumGame || !premiumGame.game_uuid) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found in premium API" });
      }

      // 3. Return the game_uuid
      return res.json({ success: true, game_uuid: premiumGame.game_uuid });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  });

  // Get all casino games: fetch all casino subcategories, get all unique providers, fetch all games for those providers from premium API, filter to those in local DB, and return merged data
  router.get("/sb-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "sb"
      const sbSubcategories = await categoriesCollection
        .find({ category: "sb" })
        .toArray();
      if (!sbSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(sbSubcategories.map((sub) => sub.provider).filter(Boolean)),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/sb-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch sb games" });
    }
  });
  router.get("/crash-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "crash"
      const crashSubcategories = await categoriesCollection
        .find({ category: "crash" })
        .toArray();
      if (!crashSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(
          crashSubcategories.map((sub) => sub.provider).filter(Boolean)
        ),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/crash-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch crash games" });
    }
  });
  router.get("/sports-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "sports"
      const sportsSubcategories = await categoriesCollection
        .find({ category: "cricket" })
        .toArray();
      if (!sportsSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(
          sportsSubcategories.map((sub) => sub.provider).filter(Boolean)
        ),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/sports-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch sports games" });
    }
  });
  router.get("/table-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "table"
      const tableSubcategories = await categoriesCollection
        .find({ category: "table" })
        .toArray();
      if (!tableSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(
          tableSubcategories.map((sub) => sub.provider).filter(Boolean)
        ),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/table-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch table games" });
    }
  });
  router.get("/slot-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "slot"
      const slotSubcategories = await categoriesCollection
        .find({ category: "slot" })
        .toArray();
      if (!slotSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(
          slotSubcategories.map((sub) => sub.provider).filter(Boolean)
        ),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/slot-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch slot games" });
    }
  });

  router.get("/fishing-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "fishing"
      const fishingSubcategories = await categoriesCollection
        .find({ category: "fishing" })
        .toArray();
      if (!fishingSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(
          fishingSubcategories.map((sub) => sub.provider).filter(Boolean)
        ),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/fishing-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch fishing games" });
    }
  });

  router.get("/casino-all", async (req, res) => {
    try {
      // 1. Get all subcategories where category === "casino"
      const casinoSubcategories = await categoriesCollection
        .find({ category: "casino" })
        .toArray();
      if (!casinoSubcategories.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 2. Collect all unique provider IDs
      const providerIds = [
        ...new Set(
          casinoSubcategories.map((sub) => sub.provider).filter(Boolean)
        ),
      ];
      if (!providerIds.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 3. Fetch all games for each provider from premium API
      const apiResPromises = providerIds.map((providerId) => {
        const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=1000&provider=${providerId}`;
        return axios.get(apiUrl, {
          headers: {
            "x-api-key":
              "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
          },
        });
      });
      const apiRes = await Promise.all(apiResPromises);
      const premiumGames = apiRes
        .map((res) => res.data.data)
        .flat()
        .filter(Boolean);
      if (!premiumGames.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      // 4. Get all local DB games (gameID)
      const dbGames = await gamesCollection.find({}).toArray();
      const dbGameIDs = dbGames.map((g) => g.gameID);
      // 5. Filter premium games to only those that exist in local DB
      const filteredGames = premiumGames.filter((g) =>
        dbGameIDs.includes(g._id)
      );
      // 6. Merge DB fields (image/hot/new) into premium games
      const mergedGames = filteredGames.map((premiumGame) => {
        const dbGame = dbGames.find((g) => g.gameID === premiumGame._id);
        return {
          ...premiumGame,
          image: dbGame?.image || premiumGame.image,
          hot: dbGame?.hot || false,
          new: dbGame?.new || false,
        };
      });
      res.json({
        success: true,
        count: mergedGames.length,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/casino-all", err.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch casino games" });
    }
  });

  // router.post("/", async (req, res) => {
  //   const gameData = req.body;
  //   gameData.createdAt = new Date();
  //   gameData.isActive = false;
  //   const result = await gamesCollection.insertOne(gameData);
  //   res.send(result);
  // });

  // Upsert game by gameID (create if not exists, update if exists)
  router.post("/upsert", async (req, res) => {
    const { gameID, image, hot, new: isNew, lobby } = req.body;
    if (!gameID) {
      return res.status(400).json({ error: "gameID is required" });
    }
    const updateFields = {};
    if (image !== undefined) updateFields.image = image;
    if (hot !== undefined) updateFields.hot = !!hot;
    if (isNew !== undefined) updateFields.new = !!isNew;
    if (lobby !== undefined) updateFields.lobby = !!lobby;
    updateFields.updatedAt = new Date();
    const result = await gamesCollection.updateOne(
      { gameID },
      { $set: updateFields, $setOnInsert: { gameID, createdAt: new Date() } },
      { upsert: true }
    );
    res.send(result);
  });

  // Save selection state by gameID (only track selected flag)
  router.post("/selected", async (req, res) => {
    try {
      const { gameID, selected } = req.body || {};
      if (!gameID) return res.status(400).json({ success: false, error: "gameID is required" });
      const sel = !!selected;
      const result = await gamesCollection.updateOne(
        { gameID },
        {
          $set: {
            gameID,
            selected: sel,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      return res.json({ success: true, updated: result.modifiedCount || result.upsertedCount || 0 });
    } catch (err) {
      console.error("/games/selected error", err);
      return res.status(500).json({ success: false, error: "Failed to save selection" });
    }
  });

  // List selected gameIDs
  router.get("/selected", async (_req, res) => {
    try {
      const rows = await gamesCollection.find({ selected: true }).project({ gameID: 1 }).toArray();
      const ids = rows.map((r) => r.gameID).filter(Boolean);
      return res.json({ success: true, count: ids.length, data: ids });
    } catch (err) {
      console.error("/games/selected GET error", err);
      return res.status(500).json({ success: false, error: "Failed to fetch selected" });
    }
  });

  // Enrich games: receive array of gameIDs, return DB info for those games
  router.post("/enrich", async (req, res) => {
    try {
      const { gameIDs } = req.body;
      if (!Array.isArray(gameIDs) || !gameIDs.length) return res.json([]);
      // Find all games in DB matching these IDs
      const dbGames = await gamesCollection
        .find({ gameID: { $in: gameIDs } })
        .toArray();
      // Only return fields needed for enrichment
      const result = dbGames.map((g) => ({
        gameID: g.gameID,
        image: g.image || null,
        hot: g.hot || false,
        new: g.new || false,
      }));
      res.json(result);
    } catch (err) {
      console.error("Error in /games/enrich", err.message);
      res.status(500).json({ error: "Failed to enrich games" });
    }
  });
  router.get("/by-provider/:providerId", async (req, res) => {
    const { providerId } = req.params;
    const { page = 1, limit = 50 } = req.query; // Client controls pagination
    try {
      // 1. Fetch paginated games from premium API
      const apiUrl = `https://apigames.oracleapi.net/api/games/pagination?page=${page}&limit=${limit}&provider=${providerId}`;
      const apiRes = await axios.get(apiUrl, {
        headers: {
          "x-api-key":
            "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
        },
      });

      const premiumResponse = apiRes.data;
      if (!premiumResponse.success || !Array.isArray(premiumResponse.data)) {
        return res.json({
          success: false,
          count: 0,
          total: 0,
          page: parseInt(page),
          totalPages: 0,
          data: [],
        });
      }

      const premiumGames = premiumResponse.data;
      if (!premiumGames.length) {
        return res.json({
          success: true,
          count: 0,
          total: premiumResponse.total || 0,
          page: parseInt(page),
          totalPages: premiumResponse.totalPages || 0,
          data: [],
        });
      }

      // 2. Get gameIDs from premium games
      const gameIDs = premiumGames.map((g) => g._id);

      // 3. Fetch matching games from your DB
      const dbGames = await gamesCollection
        .find({ gameID: { $in: gameIDs } })
        .toArray();

      // 4. Merge: Premium base + DB overrides (image/hot/new/lobby/selected); full URL for premium image
      const mergedGames = premiumGames.map((premiumGame) => {
        const dbGame = dbGames.find((db) => db.gameID === premiumGame._id);
        const mergedImage = dbGame?.image
          ? dbGame.image // DB image (relative to your server)
          : premiumGame.image
          ? `https://apigames.oracleapi.net/${premiumGame.image}` // Full premium URL
          : null;

        return {
          ...premiumGame,
          image: mergedImage, // Always full/relative URL
          ...(dbGame
            ? { hot: dbGame.hot || false, new: dbGame.new || false, lobby: !!dbGame.lobby, selected: !!dbGame.selected }
            : {}), // Merge DB-specific fields
        };
      });

      // 5. Return premium structure + merged data
      res.json({
        success: true,
        count: premiumResponse.count || mergedGames.length,
        total: premiumResponse.total || 0,
        page: parseInt(page),
        totalPages: premiumResponse.totalPages || 1,
        data: mergedGames,
      });
    } catch (err) {
      console.error("Error in /games/by-provider/:providerId", err.message);
      res.status(500).json({
        success: false,
        error: "Failed to fetch games",
        count: 0,
        total: 0,
        page: parseInt(page),
        totalPages: 0,
        data: [],
      });
    }
  });
  // Download image from URL and save to server
  router.post("/image-download", async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    try {
      // Make HTTP request to download the image as a stream
      const response = await axios({
        url: imageUrl,
        method: "GET",
        responseType: "stream",
      });

      // Generate a unique filename with timestamp
      const fileName = `${Date.now()}_${path.basename(imageUrl)}.png`; // অরিজিনাল নামের সাথে টাইমস্ট্যাম্প
      const uploadDir = path.join(__dirname, "../../uploads/images");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, fileName);

      // Save the image to the server using streaming
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      // Wait for the file to be written
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          console.error("Error writing image to file:", err);
          reject(err);
        });
      });

      // Return the relative file path (DB তে সেভ করার জন্য)
      res.json({ filePath: `/uploads/images/${fileName}` });
    } catch (error) {
      console.error("Image download failed:", error.message);
      res.status(500).json({ error: "Failed to download image" });
    }
  });

  // Add new game (POST /games)
  router.post("/", async (req, res) => {
    const gameData = req.body;

    // gameID চেক করা যাতে ডুপ্লিকেট না হয়
    const existingGame = await gamesCollection.findOne({
      gameID: gameData.gameID,
    });
    if (existingGame) {
      return res
        .status(400)
        .send({ error: "Game with this gameID already exists" });
    }

    gameData.createdAt = new Date();
    gameData.isActive = false;
    const result = await gamesCollection.insertOne(gameData);
    res.send(result);
  });

  // Get all games (GET /games)
  router.get("/", async (req, res) => {
    const games = await gamesCollection.find({}).toArray();
    res.send(games);
  });

  // Delete game by ID (DELETE /games/:id)
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ObjectId format" });
    }
    try {
      const query = { _id: new ObjectId(id) };
      const result = await gamesCollection.deleteOne(query);
      if (result.deletedCount === 0) {
        return res.status(404).send({ error: "Object not found" });
      }
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred" });
    }
  });

  //   toggleGameStatus

  router.patch("/toggle-status/:id", async (req, res) => {
    const { id } = req.params;
    const game = await gamesCollection.findOne({ _id: new ObjectId(id) });
    if (!game) {
      return res.status(404).send({ error: "Game not found" });
    }
    const status = !game.isActive;
    const query = { _id: new ObjectId(id) };
    const result = await gamesCollection.updateOne(query, {
      $set: { isActive: status },
    });
    res.send(result);
  });

  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const gameData = req.body;
    gameData.updatedAt = new Date();
    gameData.column = parseInt(gameData.column) || 1;
    const query = { _id: new ObjectId(id) };
    const result = await gamesCollection.updateOne(query, { $set: gameData });
    res.send(result);
  });

  // ?  get the game  old code
  router.post("/getGameLink", async (req, res) => {
    try {
      const { username, money, gameID } = req.body;

      console.log("this is body ", req.body);

      // ? for game bajibos.com
      const postData = {
        home_url: "https://bajibos.com",
        token: "62dd4c99767302be8969ffcf7bc8e4c2",
        username: username + "45",
        money: money,
        gameid: req.body.gameID,
      };

      // ? for game baji
      // const postData = {
      //   home_url: "https://gamebaji71.com",
      //   token: "99a6ebbc83c0e30c9a0c5237f3d907bd",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for trickboy.xyz
      // const postData = {
      //   home_url: "https://trickboy.xyz",
      //   token: "bf5891d45c356824ba6df15c9c15575d",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // // ? for game baji444
      // const postData = {
      //   home_url: "https://baji444.online",
      //   token: "a19a058e5c9ee29a23c1300866271928",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };


      // ? for game api.babu88.oracelsoft.com
      // const postData = {
      //   home_url: "https://api.babu88.oracelsoft.com",
      //   token: "c28152300c17a19d9e6e7eaeb2950ae6",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for trickboy.xyz
      // const postData = {
      //   home_url: "https://trickboy.xyz",
      //   token: "bf5891d45c356824ba6df15c9c15575d",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      // ? for melbet99
      // const postData = {
      //   home_url: "https://melbet99.com",
      //   token: "ab315e58c891ce8f875652af5d4e45c1",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      // ? for  lclb.net
      // const postData = {
      //   home_url: "https://lclb.net",
      //   token: "b18e2542823e4df498ce17e8eb2d1c49",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      // // ? for  lclb.net
      // const postData = {
      //   home_url: "https://jstlive.net",
      //   token: "c7fae069ce61bcd3bda9a8dfe330a83a",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      console.log("this is log ");

      // // ? for  babu666.live
      // const postData = {
      //   home_url: "https://babu666.live",
      //   token: "25034d2094f6312bd0e49f713efb5e45",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for  malta99.com
      // https://api.malta99.com/games/callback-data-game
      // const postData = {
      //   home_url: "https://malta99.com",
      //   token: "846fd1fb8e07fa445eae69ddaa633db4",
      //   username: username + "45", // roni
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // x-dstgame-key
      // 'x-dstgame-key: yourlicensekey'

      console.log("Sending POST request to joyhobe.com with data:", postData);

      // POST রিকোয়েস্ট
      const response = await axios.post(
        // "https://dstplay.net/getgameurl",
        "https://crazybet99.com/getgameurl",
        qs.stringify(postData),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-dstgame-key": postData.token,
          },
        }
      );

      console.log(
        "Response from dstplay.com:",
        response.data,
        "Status:",
        response.status
      );
      res.status(200).json({
        message: "POST request successful",
        joyhobeResponse: response.data,
      });
    } catch (error) {
      console.error("Error in POST /api/test/game:", error);
      res.status(500).json({
        error: "Failed to forward POST request",
        details: error.message,
      });
    }
  });

  // ! =========================== net get the game Start ==================================

  // router.post('/getGameLink', async (req, res) => {
  //   try {
  //     const { username, money, gameID } = req.body;

  //     console.log('Request body:', req.body);

  //     const postData = {
  //       home_url: "https://gamebaji71.com",
  //       token: "99a6ebbc83c0e30c9a0c5237f3d907bd",
  //       username: username + "45",
  //       money: money,
  //       gameid: gameID,
  //     };

  //     console.log('Sending POST request to dstplay.net with data:', postData);

  //     const response = await axios.post('https://dstplay.net/getgameurl', qs.stringify(postData), {
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //     });

  //     console.log('Response from dstplay.net:', response.data, 'Status:', response.status);

  //     res.status(200).json({
  //       message: 'POST request successful',
  //       joyhobeResponse: response.data, // Assuming response.data is the game URL
  //     });
  //   } catch (error) {
  //     console.error('Error in POST /getGameLink:', error.response?.data, error.response?.status);
  //     res.status(500).json({
  //       error: 'Failed to forward POST request',
  //       details: error.message,
  //     });
  //   }
  // });

  // router.get('/proxy-game-content', async (req, res) => {
  //   const { url } = req.query;

  //   // console.log("Inside proxy-game-content, URL:", url);

  //   try {
  //     if (!url) {
  //       return res.status(400).json({ error: 'Game URL is required' });
  //     }

  //     // Extract the base URL for resource path fixing
  //     const baseUrl = new URL(url).origin; // e.g., https://casinogameurl.turnkeyxgaming.com

  //     // Fetch the game content
  //     const response = await axios.get(url);
  //     let htmlContent = response.data;

  //     console.log('Fetched game content length:', htmlContent.length);

  //     // Replace "Betting Rules" with "Roni"
  //     htmlContent = htmlContent.replace(
  //       /<span class="master_fe_Header_navItemHoverable">Betting Rules<\/span>/g,
  //       '<span class="master_fe_Header_navItemHoverable">Roni</span>'
  //     );

  //     // Fix relative resource paths (CSS, JS, images, etc.) to absolute paths
  //     htmlContent = htmlContent.replace(
  //       /((?:src|href)=")(\/[^"]*")/g,
  //       `$1${baseUrl}$2`
  //     );

  //     // Inject script to check loader-container1 and send postMessage
  //     const script = `
  //       <script>
  //         document.addEventListener("DOMContentLoaded", () => {
  //           let messageSent = false;
  //           const checkLoader = () => {
  //             const loader = document.querySelector(".loader-container1");
  //             if (!loader && !messageSent) {
  //               window.parent.postMessage("loader-hidden", "*");
  //               // console.log("Loader hidden, sent postMessage");
  //               messageSent = true;
  //               clearInterval(interval);
  //             } else if (loader) {
  //               // console.log("Loader still present");
  //             }
  //           };
  //           const interval = setInterval(checkLoader, 500);
  //           // Stop checking after 10 seconds
  //           setTimeout(() => {
  //             clearInterval(interval);
  //             if (!messageSent) {
  //               window.parent.postMessage("loader-hidden", "*");
  //               // console.log("Fallback: sent postMessage after timeout");
  //               messageSent = true;
  //             }
  //           }, 10000);
  //         });
  //       </script>
  //     `;
  //     htmlContent = htmlContent.replace('</head>', `${script}</head>`);

  //     res.set('Content-Type', 'text/html');
  //     res.send(htmlContent);
  //   } catch (error) {
  //     console.error('Error in proxy-game-content:', error.response?.data, error.response?.status);
  //     res.status(500).json({
  //       error: 'Failed to fetch game content',
  //       details: error.message,
  //     });
  //   }
  // });

  // // Serve static assets (CSS, JS) with correct MIME types
  // router.get('/assets/:file', async (req, res) => {
  //   const { file } = req.params;
  //   const baseUrl = 'https://casinogameurl.turnkeyxgaming.com'; // Adjust to your game domain

  //   try {
  //     const response = await axios.get(`${baseUrl}/assets/${file}`, {
  //       responseType: 'arraybuffer', // Handle binary data for JS/CSS
  //     });

  //     // Set appropriate MIME type
  //     const mimeType = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream';
  //     res.set('Content-Type', mimeType);
  //     res.send(response.data);
  //   } catch (error) {
  //     console.error(`Error fetching asset /assets/${file}:`, error.response?.data, error.response?.status);
  //     res.status(404).send('Asset not found');
  //   }
  // });

  // ! =========================== net get the game End ==================================

  // router.post("/callback-data-game", async (req, res) => {
  //   try {

  //      // ? important - > member_account =>  user name ( amar user name ) ex : roni45
  //      // ? important - > bet_amount =>  bet amout er chaite win amout beshi hoile user er balance plus hobe
  //      // ? important - > bet_amount =>  win amount chaite bet amout beshi hoile user er balance minus hobe
  //      // ? important - > game_uid =>  game er unique identifier ( amar game id ) ex :   gameid: req.body.gameID
  //      // ? important - > serial_number =>  game khelar unique id ( just db save thakbe and user dekhbe )
  //      // ? important - > currency_code =>  bdt

  //     let { member_account, bet_amount, win_amount, game_uid, serial_number,currency_code } = req.body;
  //     if(!member_account || !game_uid || !serial_number || !currency_code ){
  //             return res.send({success:false,message:"All data are not okh."})
  //     }

  //         console.log(req.body)

  //     // Trim username to maximum 45 characters if it exists
  //     // if (username) {
  //     //   username = username.substring(0, 45);
  //     // }

  //     // const originalusername=member_account.substring(0,member_account.length-2);
  //     // // Find the user
  //     // console.log(originalusername)
  //     // const matcheduser = await usersCollection.findOne({player_id:originalusername});
  //     // console.log(matcheduser)
  //     // if (!matcheduser) {
  //     //   return res.status(404).json({ success: false, message: "User not found!" });
  //     // }

  //     // // Prepare the game history record
  //     // const gameRecord = {
  //     //   username: member_account,
  //     //   bet_amount: bet_amount,
  //     //   win_amount: win_amount,
  //     //   sports_id: game_uid,
  //     //   currency: currency_code || "BDT", // Default to BDT if not provided
  //     //   status: win_amount > 0 ? "won" : "lost", // Determine status based on win_amount
  //     //   playedAt: new Date()
  //     // };
  //     // matcheduser.balance-=bet_amount;
  //     // if(win_amount >0){
  //     //       matcheduser.balance+=win_amount;
  //     // }
  //     // matcheduser.save();
  //     // const updatedUser = await usersCollection.findByIdAndUpdate(
  //     //   { _id: matcheduser._id },
  //     //   {
  //     //     $push: { gameHistory: gameRecord }
  //     //   },
  //     //   { new: true } // Return the updated document
  //     // );

  //     // res.json({
  //     //   success: true,
  //     //   data: {
  //     //     username:originalusername,
  //     //     balance: updatedUser.balance,
  //     //     win_amount,
  //     //     bet_amount,
  //     //     game_uid,
  //     //     gameRecordId: updatedUser.gameHistory[updatedUser.gameHistory.length - 1]._id // Return the ID of the new record
  //     //   },
  //     //   { new: true } // Return the updated document
  //     // );

  //   } catch (error) {
  //     console.error("Error in callback-data:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Server error",
  //       error: process.env.NODE_ENV === 'development' ? error.message : undefined
  //     });
  //   }

  // });


  // ? old code for callback-data-game
  // router.post("/callback-data-game", async (req, res) => {
  //   try {
  //     // Extract required fields from request body
  //     let {
  //       member_account,
  //       bet_amount,
  //       win_amount,
  //       game_uid,
  //       serial_number,
  //       currency_code,
  //     } = req.body;

  //     console.log(
  //       "this is inside the function -> ",
  //       member_account,
  //       bet_amount,
  //       win_amount,
  //       game_uid,
  //       serial_number,
  //       currency_code
  //     );

  //     // Validate required fields
  //     if (!member_account || !game_uid || !serial_number || !currency_code) {
  //       return res.send({
  //         success: false,
  //         message: "All data are not provided.",
  //       });
  //     }

  //     // Ensure currency_code is BDT as per requirement
  //     if (currency_code !== "BDT") {
  //       return res.send({
  //         success: false,
  //         message: "Currency code must be BDT.",
  //       });
  //     }

  //     // Trim member_account to maximum 45 characters
  //     if (member_account) {
  //       member_account = member_account.substring(0, 45);
  //     }

  //     // Extract original username by removing last 2 characters
  //     const originalusername = member_account.substring(
  //       0,
  //       member_account.length - 2
  //     );

  //     // Find the user by username
  //     const matcheduser = await usersCollection.findOne({
  //       username: originalusername,
  //     });
  //     if (!matcheduser) {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "User not found!" });
  //     }

  //     // Prepare the game history record
  //     const gameRecord = {
  //       username: member_account,
  //       bet_amount: parseFloat(bet_amount) || 0,
  //       win_amount: parseFloat(win_amount) || 0,
  //       gameID: game_uid,
  //       serial_number: serial_number,
  //       currency: currency_code || "BDT",
  //       status: win_amount > 0 ? "won" : "lost",
  //       playedAt: new Date(),
  //     };

  //     // Calculate new balance
  //     const newBalance =
  //       (matcheduser.balance || 0) -
  //       (parseFloat(bet_amount) || 0) +
  //       (parseFloat(win_amount) || 0);

  //     // Update user balance and push game record to gameHistory
  //     const updateResult = await usersCollection.findOneAndUpdate(
  //       { _id: new ObjectId(matcheduser._id) },
  //       {
  //         $set: { balance: newBalance },
  //         $push: { gameHistory: gameRecord },
  //       },
  //       { returnDocument: "after" } // Return the updated document
  //     );

  //     // Log the update result for debugging
  //     // console.log("this is update result -> ", updateResult);

  //     // Check if update was successful
  //     // MongoDB native driver may return the document directly or in `value`
  //     const updatedUser = updateResult.value || updateResult;
  //     if (!updatedUser) {
  //       return res
  //         .status(500)
  //         .json({ success: false, message: "Failed to update user data." });
  //     }

  //     // Ensure gameHistory exists and has the new record
  //     if (!updatedUser.gameHistory || !updatedUser.gameHistory.length) {
  //       return res
  //         .status(500)
  //         .json({ success: false, message: "Game history not updated." });
  //     }

  //     // Send success response
  //     res.json({
  //       success: true,
  //       data: {
  //         username: originalusername,
  //         balance: updatedUser.balance,
  //         win_amount,
  //         bet_amount,
  //         game_uid,
  //         serial_number,
  //         gameRecordId:
  //           updatedUser.gameHistory[updatedUser.gameHistory.length - 1]._id,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error in callback-data:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Server error",
  //       error:
  //         process.env.NODE_ENV === "development" ? error.message : undefined,
  //     });
  //   }
  // });

  // ? new code for callback-data-game
// ? new code for callback-data-game



router.post("/callback-data-game", async (req, res) => {
  try {
    let {
      account_id,
      username,
      provider_code,
      amount,
      game_code,
      verification_key,
      bet_type,
      transaction_id,
      times,
    } = req.body;

    console.log(
      "Callback received ->",
      account_id,
      username,
      provider_code,
      amount,
      game_code,
      bet_type,
      transaction_id
    );

    // Validate required fields
    if (!username || !provider_code || !amount || !game_code || !bet_type) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing.",
      });
    }

    // Trim username
    username = username.substring(0, 45);
    username = username.substring(0, username.length - 2); // roni

    // Find user
    const matchedUser = await usersCollection.findOne({ username });

    if (!matchedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    console.log("Matched user ID ->", matchedUser._id);

    // Prepare game record
    const gameRecord = {
      username,
      provider_code,
      game_code,
      bet_type, // BET or SETTLE
      amount: parseFloat(amount),
      transaction_id: transaction_id || null,
      verification_key: verification_key || null,
      times: times || null,
      status: bet_type === "SETTLE" ? "won" : "lost",
      createdAt: new Date(),
    };

    // Balance calculation
    let newBalance = matchedUser.balance || 0;

    if (bet_type === "BET") {
      newBalance -= parseFloat(amount); // Deduct balance
    } else if (bet_type === "SETTLE") {
      newBalance += parseFloat(amount); // Add balance
    }

    // Update user
    const updateResult = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(matchedUser._id) },
      {
        $set: { balance: newBalance },
        $push: { gameHistory: gameRecord },
      },
      { returnDocument: "after" }
    );

    const updatedUser = updateResult.value || updateResult;

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to update user data.",
      });
    }

    // Send response
    res.json({
      success: true,
      message: "Callback processed successfully.",
      data: {
        username,
        new_balance: updatedUser.balance,
        gameRecord,
      },
    });
  } catch (error) {
    console.error("Callback error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

  // ========== Matches CRUD ===========

  // Create a new match
  router.post("/matches", async (req, res) => {
    try {
      const matchData = req.body;
      matchData.createdAt = new Date();
      const result = await matchesCollection.insertOne(matchData);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error("Error creating match:", error);
      res.status(500).json({ success: false, error: "Failed to create match" });
    }
  });

  // Get all matches
  router.get("/matches", async (req, res) => {
    try {
      const matches = await matchesCollection.find({}).toArray();
      res.json({ success: true, data: matches });
    } catch (error) {
      console.error("Error fetching matches:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch matches" });
    }
  });

  // Get a single match by ID
  router.get("/matches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid match ID" });
      }
      const match = await matchesCollection.findOne({ _id: new ObjectId(id) });
      if (!match) {
        return res
          .status(404)
          .json({ success: false, error: "Match not found" });
      }
      res.json({ success: true, data: match });
    } catch (error) {
      console.error("Error fetching match:", error);
      res.status(500).json({ success: false, error: "Failed to fetch match" });
    }
  });

  // Update a match by ID
  router.patch("/matches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid match ID" });
      }
      const matchData = req.body;
      matchData.updatedAt = new Date();
      const result = await matchesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: matchData }
      );
      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Match not found" });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({ success: false, error: "Failed to update match" });
    }
  });

  // Delete a match by ID
  router.delete("/matches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid match ID" });
      }
      const result = await matchesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Match not found" });
      }
      res.json({ success: true, message: "Match deleted successfully" });
    } catch (error) {
      console.error("Error deleting match:", error);
      res.status(500).json({ success: false, error: "Failed to delete match" });
    }
  });

  return router;
};

module.exports = gameApi;
