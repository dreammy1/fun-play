const express = require("express");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");

const PLAYER_ID_PREFIX = "fun_";
const CURRENCY = "BDT";

const memberAccountForUserId = (userId) => `${PLAYER_ID_PREFIX}${userId}`;

const safeEqual = (left, right) => {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const amountDivisor = Number(process.env.BETNEX_CALLBACK_AMOUNT_DIVISOR) || 1;
  if (!Number.isFinite(amountDivisor) || amountDivisor <= 0) return null;
  const amount = Number(value) / amountDivisor;
  if (!Number.isFinite(amount)) return null;
  const rounded = roundMoney(amount);
  if (Math.abs(amount - rounded) > 0.000001) return null;
  return rounded;
};

const callbackAuth = (req) => {
  const mode = String(
    process.env.BETNEX_CALLBACK_AUTH_MODE || "hmac-sha256"
  ).toLowerCase();

  if (mode === "api-key") {
    const expectedKey =
      process.env.BETNEX_CALLBACK_API_KEY || process.env.BETNEX_API_KEY;
    if (!expectedKey) return { configured: false, valid: false };
    return {
      configured: true,
      valid: safeEqual(req.body?.api_key, expectedKey),
    };
  }

  if (mode !== "hmac-sha256") return { configured: false, valid: false };

  const secret = process.env.BETNEX_CALLBACK_SECRET;
  if (!secret) return { configured: false, valid: false };

  const signatureHeader = String(
    process.env.BETNEX_CALLBACK_SIGNATURE_HEADER || "x-betnex-signature"
  ).toLowerCase();
  const timestampHeader = String(
    process.env.BETNEX_CALLBACK_TIMESTAMP_HEADER || "x-betnex-timestamp"
  ).toLowerCase();
  const signature = String(req.get(signatureHeader) || "").replace(/^sha256=/i, "");
  const timestamp = String(req.get(timestampHeader) || "");
  const timestampNumber = Number(timestamp);
  const timestampMs =
    timestampNumber > 1_000_000_000_000
      ? timestampNumber
      : timestampNumber * 1000;
  const toleranceSeconds = Number(process.env.BETNEX_CALLBACK_TOLERANCE_SECONDS) || 300;
  const timestampIsFresh =
    Number.isFinite(timestampMs) &&
    Math.abs(Date.now() - timestampMs) <= toleranceSeconds * 1000;

  if (!signature || !timestampIsFresh || !Buffer.isBuffer(req.rawBody)) {
    return { configured: true, valid: false };
  }

  // Keep this byte-level and never serialize req.body again. Betnex account
  // versions differ on whether the timestamp is included in the signed bytes.
  const signatureFormat = String(
    process.env.BETNEX_CALLBACK_SIGNATURE_FORMAT || "timestamp-dot-body"
  ).toLowerCase();
  let signedPayload;
  if (signatureFormat === "timestamp-dot-body") {
    signedPayload = Buffer.concat([
      Buffer.from(`${timestamp}.`, "utf8"),
      req.rawBody,
    ]);
  } else if (signatureFormat === "raw-body") {
    signedPayload = req.rawBody;
  } else {
    return { configured: false, valid: false };
  }
  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  const expectedBase64 = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("base64");

  return {
    configured: true,
    valid: safeEqual(signature.toLowerCase(), expectedHex.toLowerCase()) ||
      safeEqual(signature, expectedBase64),
  };
};

const responseFor = (success, message, money, extra = {}) => ({
  success,
  msg: message,
  handle: success,
  money: roundMoney(Number(money) || 0),
  ...extra,
});

const betnexWalletApi = (
  usersCollection,
  transactionsCollection,
  mongoClient
) => {
  const router = express.Router();

  router.post("/callback", async (req, res) => {
    const auth = callbackAuth(req);
    if (!auth.configured) {
      return res.status(503).json(
        responseFor(false, "Betnex callback authentication is not configured.", 0)
      );
    }
    if (!auth.valid) {
      return res.status(200).json(
        responseFor(false, "Callback authentication failed.", 0)
      );
    }

    const {
      bet_amount: rawBetAmount,
      win_amount: rawWinAmount,
      member_account: rawMemberAccount,
      game_uid: rawGameUid,
      game_round: rawGameRound,
      currency_code: rawCurrency,
      serial_number: rawSerialNumber,
    } = req.body || {};

    const memberAccount = String(rawMemberAccount || "").trim();
    const serialNumber = String(rawSerialNumber || "").trim();
    const gameUid = String(rawGameUid || "").trim();
    const gameRound = String(rawGameRound || "").trim();
    const currency = String(rawCurrency || "").trim().toUpperCase();
    const betAmount = parseAmount(rawBetAmount);
    const winAmount = parseAmount(rawWinAmount);
    const memberMatch = memberAccount.match(/^fun_([a-f\d]{24})$/i);

    if (
      !memberMatch ||
      !serialNumber ||
      serialNumber.length > 200 ||
      !gameUid ||
      gameUid.length > 200 ||
      !gameRound ||
      gameRound.length > 200 ||
      betAmount === null ||
      winAmount === null ||
      currency !== CURRENCY
    ) {
      return res.status(200).json(
        responseFor(false, "Invalid callback payload or unsupported currency.", 0)
      );
    }

    if (!transactionsCollection || !mongoClient) {
      return res.status(503).json(
        responseFor(false, "Betnex wallet storage is unavailable.", 0)
      );
    }

    const userId = new ObjectId(memberMatch[1]);
    const netChange = roundMoney(-betAmount + winAmount);
    const session = mongoClient.startSession();
    let outcome;

    try {
      outcome = await session.withTransaction(async () => {
        const priorTransaction = await transactionsCollection.findOne(
          { serialNumber },
          { session }
        );

        if (priorTransaction) {
          if (String(priorTransaction.userId) !== String(userId)) {
            return {
              success: false,
              message: "Transaction identifier is already associated with another player.",
              money: 0,
            };
          }
          const currentUser = await usersCollection.findOne(
            { _id: userId },
            { session, projection: { balance: 1 } }
          );
          return {
            success: priorTransaction.status === "processed",
            message:
              priorTransaction.status === "processed"
                ? "Duplicate callback acknowledged."
                : "Previously rejected callback acknowledged.",
            money: currentUser?.balance ?? priorTransaction.balanceAfter ?? 0,
            duplicate: true,
          };
        }

        const user = await usersCollection.findOne(
          { _id: userId },
          { session, projection: { username: 1, balance: 1, gameHistory: 1 } }
        );
        if (!user) {
          return { success: false, message: "Player account not found.", money: 0 };
        }

        const currentBalance = Number(user.balance ?? 0);
        if (!Number.isFinite(currentBalance) || currentBalance < 0) {
          throw new Error("Player wallet contains an invalid balance.");
        }

        const newBalance = roundMoney(currentBalance + netChange);
        const now = new Date();
        const transaction = {
          provider: "BETNEX",
          serialNumber,
          userId,
          memberAccount,
          gameUid,
          gameRound,
          currency,
          betAmount,
          winAmount,
          balanceBefore: roundMoney(currentBalance),
          balanceAfter: newBalance,
          status: newBalance < 0 ? "rejected_insufficient_funds" : "processed",
          receivedAt: now,
        };

        if (newBalance < 0) {
          transaction.balanceAfter = roundMoney(currentBalance);
          await transactionsCollection.insertOne(transaction, { session });
          return {
            success: false,
            message: "Insufficient funds.",
            money: currentBalance,
            code: "INSUFFICIENT_FUNDS",
          };
        }

        const historyEntry = {
          provider: "BETNEX",
          serial_number: serialNumber,
          game_uid: gameUid,
          game_round: gameRound,
          currency,
          bet_amount: betAmount,
          win_amount: winAmount,
          balance_before: roundMoney(currentBalance),
          balance_after: newBalance,
          playedAt: now,
        };

        // Compare-and-set on the previous balance prevents overwriting a
        // concurrent deposit, withdrawal, or game callback.
        const userBalanceFilter = { _id: userId };
        if (user.balance === undefined) {
          userBalanceFilter.balance = { $exists: false };
        } else {
          userBalanceFilter.balance = user.balance;
        }
        const updateResult = await usersCollection.updateOne(
          userBalanceFilter,
          {
            $set: { balance: newBalance },
            $push: { gameHistory: historyEntry },
          },
          { session }
        );

        if (updateResult.matchedCount !== 1) {
          throw new Error("Player wallet changed during callback processing.");
        }

        await transactionsCollection.insertOne(transaction, { session });
        return { success: true, message: "Callback processed successfully.", money: newBalance };
      });
    } catch (error) {
      // Concurrent duplicate deliveries can race before either transaction
      // commits. The unique serial-number index makes the winner authoritative.
      if (error?.code === 11000) {
        try {
          const priorTransaction = await transactionsCollection.findOne({ serialNumber });
          if (priorTransaction) {
            const currentUser = await usersCollection.findOne(
              { _id: priorTransaction.userId },
              { projection: { balance: 1 } }
            );
            outcome = {
              success: priorTransaction.status === "processed",
              message: "Duplicate callback acknowledged.",
              money: currentUser?.balance ?? priorTransaction.balanceAfter ?? 0,
              duplicate: true,
            };
          }
        } catch (lookupError) {
          console.error("Betnex duplicate callback lookup failed:", lookupError.message);
        }
      }

      if (!outcome) {
        console.error("Betnex wallet callback failed:", error.message);
        return res.status(500).json(
          responseFor(false, "Wallet callback could not be processed; retry is safe.", 0)
        );
      }
    } finally {
      await session.endSession();
    }

    return res.status(200).json(
      responseFor(outcome.success, outcome.message, outcome.money, {
        ...(outcome.code ? { code: outcome.code } : {}),
      })
    );
  });

  return router;
};

module.exports = { betnexWalletApi, memberAccountForUserId };
