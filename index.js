require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const app = express();
const port = 5002;

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL;
const secret = "314781839wjd3190u4edn13ed381de31bfu13ii";

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://productmanagement:productmanagement@cluster0.tch1uh5.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// GET route
app.get("/health", (req, res) => {
  res.json({ Health: "Okay" });
});

app.get("/products", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }
    // If the token is valid, save the user details to the request object
    req.user = decoded;
    const db = client.db("product-management");
    const productsCollection = db.collection("products");
    const products = await productsCollection.find({}).toArray();
    res.send(products);
  });
});

async function validateStock(items, token) {
  try {
    for (i in items) {
      const item = items[i];
      const response = await axios.post(
        INVENTORY_SERVICE_URL,
        {
          productName: item.productName,
          quantity: item.quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const isValid = response.data;
      if (!isValid) {
        return false;
      }
    }
  } catch (err) {
    console.error(err);
  }
  return true;
}

async function updateInventory(items, token) {
  try {
    for (i in items) {
      const item = items[i];
      const response = await axios.patch(
        INVENTORY_SERVICE_URL,
        {
          productName: item.productName,
          quantity: item.quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const isValid = response.data;
      if (!isValid) {
        return false;
      }
    }
  } catch (err) {
    console.error(err);
  }
  return true;
}

app.post("/order", async (req, res) => {
  const items = req.body;

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.sendStatus(401);
  }

  await jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }
    // If the token is valid, save the user details to the request object
    req.user = decoded;

    const result = await validateStock(items, token);
    if (!result) {
      res.send({
        orderStatus: "Failed",
        message: `Some of the products are out of stock. Please try again.`,
      });
      return;
    }

    const inventoryResult = await updateInventory(items, token);

    if (!inventoryResult) {
      res.send({ orderStatus: "Failed", message: `Something went wrong` });
      return;
    }

    res.send({ orderStatus: "Successful" });
  });
});

// start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
