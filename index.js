const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.imtr4p9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollections = client.db("manufacturer").collection("product");
    const reviewsCollections = client.db("manufacturer").collection("reviews");
    const ordersCollections = client.db("manufacturer").collection("orders");
    app.get("/products", async (req, res) => {
      const query = req.body;
      const products = await productCollections.find(query).toArray();
      res.send(products);
    });
    // Purchase Api
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const productId = await productCollections.findOne(query);
      res.send(productId);
    });
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const newstock = req.body;
      const newMinorder = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          stock: newstock.stock,
          minorder: newMinorder.minorder,
        },
      };
      const updateStock = await productCollections.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(updateStock);
    });
    // Reviews
    app.get("/review", async (req, res) => {
      const query = req.body;
      const review = await reviewsCollections.find(query).toArray();
      res.send(review);
    });
    // review post 
    app.post("/review", async (req, res) => {
      const query = req.body;
      const reviews = await reviewsCollections.insertOne(query);
      res.send(reviews);
    });
    // Orders Collection
    app.post("/myOrders", async (req, res) => {
      const query = req.body;
      const order = await ordersCollections.insertOne(query);
      res.send(order);
    });
    app.get("/myOrders", async (req, res) => {
      const query = req.body;
      const orders = await ordersCollections.find(query).toArray();
      res.send(orders);
    });
    
    app.get("/myOrders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = ordersCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
  }
}

run().catch;
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
