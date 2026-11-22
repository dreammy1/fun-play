const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const depositPaymentMethodsApi = require("../apis/depositPaymentMethodsApi/depositPaymentMethodsApi");
const depositTransactionsApi = require("../apis/depositTransactionsApi/depositTransactionsApi");

const JWT_SECRET = "deposit-test-secret";
process.env.JWT_SECRET = JWT_SECRET;

function createFixture() {
  const customerId = new ObjectId();
  const otherCustomerId = new ObjectId();
  const activeMethod = {
    _id: new ObjectId(),
    methodNameBD: "Test method",
    agentWalletNumber: "",
    gateway: ["bKash"],
    userInputs: [],
    status: "active",
  };
  const inactiveMethod = {
    _id: new ObjectId(),
    methodNameBD: "Disabled method",
    gateway: ["bKash"],
    userInputs: [],
    status: "inactive",
  };
  const legacyMethod = {
    _id: new ObjectId(),
    methodNameBD: "Legacy method",
    gateway: ["Nagad"],
    userInputs: [],
  };
  const methods = [activeMethod, inactiveMethod, legacyMethod];
  const insertedTransactions = [];
  const methodCollection = {
    find: () => ({ toArray: async () => methods }),
    findOne: async ({ _id }) =>
      methods.find((method) => method._id.toString() === _id.toString()) || null,
  };
  const usersCollection = {
    findOne: async () => ({ _id: customerId }),
  };
  const transactionCollection = {
    insertOne: async (transaction) => {
      insertedTransactions.push(transaction);
      return { insertedId: new ObjectId() };
    },
  };
  const promotionsCollection = { findOne: async () => null };
  const app = express();
  app.use(express.json());
  app.use("/depositPaymentMethod", depositPaymentMethodsApi(methodCollection));
  app.use(
    "/depositTransactions",
    depositTransactionsApi(
      transactionCollection,
      usersCollection,
      methodCollection,
      promotionsCollection
    )
  );

  return {
    app,
    activeMethod,
    inactiveMethod,
    legacyMethod,
    customerId,
    otherCustomerId,
    insertedTransactions,
    token: jwt.sign({ userId: customerId.toString() }, JWT_SECRET),
  };
}

async function startServer(t, app) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(
    () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  );
  return `http://127.0.0.1:${server.address().port}`;
}

test("customer method endpoint returns active and legacy methods only", async (t) => {
  const fixture = createFixture();
  const base = await startServer(t, fixture.app);
  const response = await fetch(`${base}/depositPaymentMethod/deposit-methods/active`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    body.data.map((method) => method._id),
    [fixture.activeMethod._id.toString(), fixture.legacyMethod._id.toString()]
  );
  assert.equal(body.data.some((method) => method.status === "inactive"), false);
});

test("authenticated deposit is inserted pending for the token owner", async (t) => {
  const fixture = createFixture();
  const base = await startServer(t, fixture.app);
  const response = await fetch(`${base}/depositTransactions/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodId: fixture.activeMethod._id.toString(),
      amount: "500",
      gateways: "bKash",
      userInputs: {},
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(body.data.status, "pending");
  assert.equal(fixture.insertedTransactions.length, 1);
  assert.equal(
    fixture.insertedTransactions[0].userId.toString(),
    fixture.customerId.toString()
  );
  assert.equal(fixture.insertedTransactions[0].status, "pending");
});

test("deposit creation rejects a forged user ID", async (t) => {
  const fixture = createFixture();
  const base = await startServer(t, fixture.app);
  const response = await fetch(`${base}/depositTransactions/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: fixture.otherCustomerId.toString(),
      paymentMethodId: fixture.activeMethod._id.toString(),
      amount: "500",
      gateways: "bKash",
      userInputs: {},
    }),
  });

  assert.equal(response.status, 403);
  assert.equal(fixture.insertedTransactions.length, 0);
});

test("deposit creation rejects an inactive configured method", async (t) => {
  const fixture = createFixture();
  const base = await startServer(t, fixture.app);
  const response = await fetch(`${base}/depositTransactions/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodId: fixture.inactiveMethod._id.toString(),
      amount: "500",
      gateways: "bKash",
      userInputs: {},
    }),
  });

  assert.equal(response.status, 400, "Inactive method was not rejected");
  assert.equal(fixture.insertedTransactions.length, 0);
});

test("deposit creation rejects a method ID that is not configured", async (t) => {
  const fixture = createFixture();
  const base = await startServer(t, fixture.app);
  const response = await fetch(`${base}/depositTransactions/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodId: "000000000000000000000000",
      amount: "500",
      gateways: "bKash",
      userInputs: {},
    }),
  });

  assert.equal(response.status, 404);
  assert.equal(fixture.insertedTransactions.length, 0);
});
