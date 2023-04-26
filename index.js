const express = require("express");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const axios = require("axios")
const app = express();
const port = 5002;

const secret = "314781839wjd3190u4edn13ed381de31bfu13ii"


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://productmanagement:productmanagement@cluster0.tch1uh5.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// GET route
app.get("/health", (req, res) => {
  res.json({ Health: "Okay" });
});

app.get("/products", async(req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }
    // If the token is valid, save the user details to the request object
    req.user = decoded;
    const db = client.db('product-management');
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}).toArray();
    res.send(products)
  });
  
});


app.post("/order", async(req, res) => {
   const { items } = req.body
   await items.forEach(async(item) => {
    axios.post('http://localhost:5003/inventory', {
    productName: item.productName,
    stock: item.stock,
  })
  .then(response => {
    const isValid = response.data
    if(!isValid){
      res.send(`Product ${item.productName} is out of stock`)
    }
  })
  .catch(error => {
    console.error(error);
  });
   });

   await items.forEach(async(item) => {
    axios.patch('http://localhost:5003/inventory', {
    productName: item.productName,
    stock: item.stock,
  })
  .then(response => {
    const isValid = response.data
    if(!isValid){
      res.send(`Something went wrong`)
    }
  })
  .catch(error => {
    console.error(error);
  });
   });
   res.send("Order Placed")
});

// start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
