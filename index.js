const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
app.use(express.json());
const jwt = require("jsonwebtoken");
app.use(cors());

// Database connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { get } = require("express/lib/response");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.imtr4p9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verify jwt token

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    await client.connect();
    const productCollections = client.db("manufacturer").collection("product");
    const reviewsCollections = client.db("manufacturer").collection("reviews");
    const ordersCollections = client.db("manufacturer").collection("orders");
    const usersCollection = client.db("manufacturer").collection("users");

    // const verifyAdmin = async (req, res, next) => {
    //   const requester = req.decoded.email;
    //   const requesterAccount = await usersCollection.findOne({
    //     email: requester,
    //   });
    //   if (requesterAccount.role === "admin") {
    //     next();
    //   } else {
    //     res.status(403).send({ message: "forbidden" });
    //   }
    // };

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
    // Orders Collection post order
    app.post("/myOrders", async (req, res) => {
      const query = req.body;
      const order = await ordersCollections.insertOne(query);
      res.send(order);
    });
    // get orders ordersCollections
    app.get("/myOrders", async (req, res) => {
      const query = req.body;
      const orders = await ordersCollections.find(query).toArray();
      res.send(orders);
    });
    // ordersCollections find order email address
    app.get("/myitems", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = ordersCollections.find(query);
        const result = await cursor.toArray();
        return res.send(result);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });
    // Delet user orders
    app.delete("/myOrders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletProduct = await ordersCollections.deleteOne(query);
      res.send(deletProduct);
    });
    // Get a admin api
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      res.send({ result, token });
    });
    // get users
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    // Admin Api

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
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
