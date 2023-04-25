const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = 3000;

// Communication among different services
const USER_MANAGEMENT_URL = "http://192.168.29.223:5000";

// middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// GET route
app.get("/products", (req, res) => {
  const products = [
    { id: 1, name: "Business Cards" },
    { id: 2, name: "Post Cards" },
  ];
  res.send(products);
});

app.get("/health", async (req, res) => {
  const response = await axios.get(`${USER_MANAGEMENT_URL}/health`);
  res.json(response.data);
});

// start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
