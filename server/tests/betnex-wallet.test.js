const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const gameApi = require("../apis/gameApi/gameApi");
const {
  betnexWalletApi,
  memberAccountForUserId,
} = require("../apis/gameApi/betnexWalletApi");

const listen = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });

const close = (server) => new Promise((resolve) => server.close(resolve));

const sendJson = async (server, path, body, headers = {}) => {
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}${path}`,
    {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }
  );
  return { status: response.status, data: await response.json() };
};

test("game launch uses the authenticated user's current server-side balance", async () => {
  const userId = new ObjectId();
  const player = { _id: userId, username: "customer", balance: 123.45 };
  const previousEnv = {
    JWT_SECRET: process.env.JWT_SECRET,
    BETNEX_API_KEY: process.env.BETNEX_API_KEY,
    BETNEX_API_BASE_URL: process.env.BETNEX_API_BASE_URL,
    BETNEX_CURRENCY: process.env.BETNEX_CURRENCY,
  };
  process.env.JWT_SECRET = "wallet-test-jwt";
  process.env.BETNEX_API_KEY = "wallet-test-provider-key";
  process.env.BETNEX_API_BASE_URL = "https://livecasinoapi.betnex.co/casino";
  process.env.BETNEX_CURRENCY = "BDT";
  let launchRequest;
  const providerClient = {
    get: async () => {
      throw new Error("Unexpected catalogue request");
    },
    post: async (url, data, config) => {
      launchRequest = { url, data, config };
      return {
        data: {
          code: 0,
          payload: { game_launch_url: "https://provider.example/session" },
        },
      };
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/games",
    gameApi({}, { findOne: async () => player }, {}, {}, providerClient)
  );
  const server = await listen(app);
  const token = jwt.sign(
    { userId: userId.toString(), username: "customer" },
    process.env.JWT_SECRET
  );

  try {
    const noAuth = await sendJson(server, "/games/getGameLink", {
      gameID: "game-1",
    });
    assert.equal(noAuth.status, 401);

    const result = await sendJson(
      server,
      "/games/getGameLink",
      { gameID: "game-1", money: 999999, username: "attacker" },
      { authorization: `Bearer ${token}` }
    );

    assert.equal(result.status, 200);
    assert.equal(launchRequest.url, "https://livecasinoapi.betnex.co/casino/getgameurl");
    assert.equal(launchRequest.data.money, 123.45);
    assert.equal(
      launchRequest.data.username,
      memberAccountForUserId(userId.toString())
    );
    assert.equal(
      launchRequest.config.headers["x-betnex-key"],
      "wallet-test-provider-key"
    );
    assert.equal(launchRequest.data.currency, "BDT");
  } finally {
    await close(server);
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("Betnex callbacks settle a wallet exactly once and reject overspending", async () => {
  const userId = new ObjectId();
  const player = { _id: userId, username: "customer", balance: 1000, gameHistory: [] };
  const transactions = new Map();
  const transactionCollection = {
    findOne: async ({ serialNumber }) => transactions.get(serialNumber) || null,
    insertOne: async (row) => {
      if (transactions.has(row.serialNumber)) {
        const error = new Error("duplicate serial number");
        error.code = 11000;
        throw error;
      }
      transactions.set(row.serialNumber, row);
      return { insertedId: new ObjectId() };
    },
  };
  const usersCollection = {
    findOne: async ({ _id }) =>
      String(_id) === String(userId) ? player : null,
    updateOne: async (filter, update) => {
      if (String(filter._id) !== String(userId)) return { matchedCount: 0 };
      if (
        filter.balance &&
        typeof filter.balance === "object" &&
        filter.balance.$exists === false &&
        "balance" in player
      ) {
        return { matchedCount: 0 };
      }
      if (
        filter.balance !== undefined &&
        typeof filter.balance !== "object" &&
        player.balance !== filter.balance
      ) {
        return { matchedCount: 0 };
      }
      Object.assign(player, update.$set);
      if (update.$push?.gameHistory) player.gameHistory.push(update.$push.gameHistory);
      return { matchedCount: 1 };
    },
  };
  const mongoClient = {
    startSession: () => ({
      withTransaction: async (callback) => callback(),
      endSession: async () => {},
    }),
  };
  const previousEnv = {
    BETNEX_CALLBACK_AUTH_MODE: process.env.BETNEX_CALLBACK_AUTH_MODE,
    BETNEX_CALLBACK_SECRET: process.env.BETNEX_CALLBACK_SECRET,
    BETNEX_CALLBACK_SIGNATURE_HEADER:
      process.env.BETNEX_CALLBACK_SIGNATURE_HEADER,
    BETNEX_CALLBACK_TIMESTAMP_HEADER:
      process.env.BETNEX_CALLBACK_TIMESTAMP_HEADER,
    BETNEX_CALLBACK_SIGNATURE_FORMAT:
      process.env.BETNEX_CALLBACK_SIGNATURE_FORMAT,
    BETNEX_CALLBACK_AMOUNT_DIVISOR:
      process.env.BETNEX_CALLBACK_AMOUNT_DIVISOR,
  };
  process.env.BETNEX_CALLBACK_AUTH_MODE = "hmac-sha256";
  process.env.BETNEX_CALLBACK_SECRET = "wallet-test-callback-secret";
  process.env.BETNEX_CALLBACK_SIGNATURE_HEADER = "x-betnex-signature";
  process.env.BETNEX_CALLBACK_TIMESTAMP_HEADER = "x-betnex-timestamp";
  process.env.BETNEX_CALLBACK_SIGNATURE_FORMAT = "timestamp-dot-body";
  process.env.BETNEX_CALLBACK_AMOUNT_DIVISOR = "1";

  const app = express();
  app.use(
    express.json({
      verify: (req, res, buffer) => {
        req.rawBody = Buffer.from(buffer);
      },
    })
  );
  app.use(
    "/games/betnex",
    betnexWalletApi(usersCollection, transactionCollection, mongoClient)
  );
  const server = await listen(app);

  const signedCallback = async (payload) => {
    const rawBody = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto
      .createHmac("sha256", process.env.BETNEX_CALLBACK_SECRET)
      .update(Buffer.concat([Buffer.from(`${timestamp}.`), Buffer.from(rawBody)]))
      .digest("hex");
    return sendJson(server, "/games/betnex/callback", payload, {
      "x-betnex-timestamp": timestamp,
      "x-betnex-signature": signature,
    });
  };

  try {
    const common = {
      member_account: memberAccountForUserId(userId.toString()),
      game_uid: "game-1",
      game_round: "round-1",
      currency_code: "BDT",
    };
    const forged = await sendJson(
      server,
      "/games/betnex/callback",
      {
        ...common,
        bet_amount: 100,
        win_amount: 0,
        serial_number: "forged-serial",
      },
      {
        "x-betnex-timestamp": String(Math.floor(Date.now() / 1000)),
        "x-betnex-signature": "invalid-signature",
      }
    );
    assert.equal(forged.data.handle, false);
    assert.equal(player.balance, 1000);
    assert.equal(transactions.size, 0);

    let result = await signedCallback({
      ...common,
      bet_amount: 100,
      win_amount: 0,
      serial_number: "serial-bet",
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.handle, true);
    assert.equal(result.data.money, 900);

    result = await signedCallback({
      ...common,
      bet_amount: 0,
      win_amount: 150,
      serial_number: "serial-win",
    });
    assert.equal(result.data.money, 1050);

    result = await signedCallback({
      ...common,
      bet_amount: 0,
      win_amount: 150,
      serial_number: "serial-win",
    });
    assert.equal(result.data.handle, true);
    assert.equal(result.data.money, 1050);
    assert.equal(transactions.size, 2);
    assert.equal(player.gameHistory.length, 2);

    result = await signedCallback({
      ...common,
      bet_amount: -50,
      win_amount: 0,
      serial_number: "serial-bet-refund",
    });
    assert.equal(result.data.handle, true);
    assert.equal(result.data.money, 1100);
    result = await signedCallback({
      ...common,
      bet_amount: 0,
      win_amount: -50,
      serial_number: "serial-win-reversal",
    });
    assert.equal(result.data.money, 1050);

    result = await signedCallback({
      ...common,
      bet_amount: 5000,
      win_amount: 0,
      serial_number: "serial-insufficient",
    });
    assert.equal(result.data.handle, false);
    assert.equal(result.data.code, "INSUFFICIENT_FUNDS");
    assert.equal(player.balance, 1050);
    result = await signedCallback({
      ...common,
      bet_amount: 5000,
      win_amount: 0,
      serial_number: "serial-insufficient",
    });
    assert.equal(result.data.handle, false);
    assert.equal(result.data.money, 1050);
    assert.equal(player.balance, 1050);
    assert.equal(transactions.size, 5);
  } finally {
    await close(server);
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
