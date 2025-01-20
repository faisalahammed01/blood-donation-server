const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//!----------- Middleware----------------
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h13ev.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //!------------------------DB__COLLECTION-------------------------------

    const userCollection = client.db("BloodDB").collection("users");
    const recipientCollection = client.db("BloodDB").collection("recipient");

    //!----------------------------Users-AUTH----------------------------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // !------------------------------Recipient-NEED-BLOOD--------------------------

    app.post("/recipient", async (req, res) => {
      const recipientUser = req.body;
      const result = await recipientCollection.insertOne(recipientUser);
      res.send(result);
    });
    app.get("/MyDonation", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = recipientCollection
        .find(query)
        .sort({ date: -1 })
        .limit(3);
      const result = await cursor.toArray();
      res.send(result);
    });
    //  ----------------------Delete Item---------------------

    app.get("/donationDelete", async (req, res) => {
      const cursor = recipientCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.delete("/donationDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipientCollection.deleteOne(query);
      res.send(result);
    });

    // ----------------------Update Item----------------------------
    app.get("/DonationUp/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipientCollection.findOne(query);
      res.send(result);
    });

    app.put("/DonationUp/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: req.body,
      };

      const result = await recipientCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      res.send(result);
    });
    // ----------------------------------------Details---------------------------------------
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipientCollection.findOne(query);
      res.send(result);
    });

    //?----------------------------------------------------------------------------------------
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ?----------------------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
