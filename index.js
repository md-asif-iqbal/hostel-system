const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const cors = require("cors");
require("dotenv").config();
app.use(express.json());
const jwt = require("jsonwebtoken");
app.use(cors());
const stripe = require("stripe")(
  "sk_test_51LXS98B5Y3AeAE8ixEr3XbAzakqMdCNqxsU9YIZyhx8IaSGdcIaHNUdF4zPSaludDIIwz7kxSsnL6bcAkD4EUURB00BKYOJvq7"
);

// JWT Token here
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
// Database connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.98ud0qo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const bookingCollection = client.db("Hostel").collection("Booking");
    const RoomCollection = client.db("Hostel").collection("Room");
    const FoodCollection = client.db("Hostel").collection("Food");
    const mealsCollection = client.db("Hostel").collection("Meals");
    const usersCollection = client.db("Hostel").collection("User");

    // User Access Token
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
      const results = await mealsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10h" }
      );
      res.send({ result, results, token });
    });

    // use Admin Function
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      console.log(requesterAccount);
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };
    // user Update Profile
    app.get("/users", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const quary = { email: email };
        const purchased = await usersCollection.find(quary).toArray();
        res.send(purchased);
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    });
    app.get("/users/:email", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.params.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        res.send(user);
      } else {
        res.status(403).send({ message: "Forbidden Access!" });
      }
    });
    // Update user..........

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const profile = req.body;
      console.log(profile);

      const filter = { email: email };
      const updateDoc = {
        $set: {
          name: profile.name,
          image: profile.img,
          number: profile.number,
          education: profile.education,
          location: profile.location,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // admin here========
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });
    // -----user admin email find-------
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // admin here========
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });
    // -----user admin email find-------
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/myitems", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      return res.send(result);
    });

    // Booking Collection ==============
    app.post("/booking", async (req, res) => {
      const query = req.body;
      const reviews = await bookingCollection.insertOne(query);
      res.send(reviews);
    });

    app.post("/users", async (req, res) => {
      const query = req.body;
      const user = await usersCollection.insertOne(query);
      res.send(user);
    });
    app.post("/room", verifyJWT, async (req, res) => {
      const products = req.body;
      const result = await RoomCollection.insertOne(products);
      return res.send({ success: true, result });
    });

    app.get("/room", async (req, res) => {
      const query = req.body;
      const room = await RoomCollection.find(query).toArray();
      res.send(room);
    });
    app.delete("/room/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const products = await RoomCollection.deleteOne(query);
      res.send(products);
    });
    // Purchase Api
    app.get("/room/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const roomId = await RoomCollection.findOne(query);
      res.send(roomId);
    });
    // Food Collection Here
    app.get("/food", async (req, res) => {
      const query = req.body;
      const food = await FoodCollection.find(query).toArray();
      res.send(food);
    });
    // Single Food Details
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const FoodId = await FoodCollection.findOne(query);
      res.send(FoodId);
    });

    app.post("/booking", async (req, res) => {
      const query = req.body;
      const reviews = await bookingCollection.insertOne(query);
      res.send(reviews);
    });

    app.put("/orders/paid/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { status: update.status },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const service = req.body;
      const price = service.amount;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    // app.put("/meals/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const update = req.body;
    //   const filter = { email: email };
    //   const updateDoc = {
    //     $set: {
    //       date: {
    //         date: update.date,
    //         moring: update.morning,
    //         lunch: update.lunch,
    //         dinner: update.dinner,
    //       },
    //     },
    //   };
    //   const result = await mealsCollection.updateOne(filter, updateDoc);
    //   res.send(result);
    // });
    app.post("/meals/:email", async (req, res) => {
      const email = req.params.email;
      const update = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          $date: {
            date: update.date,
            moring: update.morning,
            lunch: update.lunch,
            dinner: update.dinner,
          },
        },
      };
      const result = await mealsCollection.insertOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const profile = req.body;
      console.log(profile);

      const filter = { email: email };
      const updateDoc = {
        $set: {
          moring: profile.name,
          lunch: profile.img,
          dinner: profile.number,
        },
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
  console.log(`uiu listening on port ${port}`);
});
