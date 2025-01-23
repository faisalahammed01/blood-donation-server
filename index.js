const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
    const donorCollection = client.db("BloodDB").collection("donor");
    const fundCollection = client.db("BloodDB").collection("fund");
    const blogCollection = client.db("BloodDB").collection("blog");
    //? --------------JWT---------------
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // ---middleware---------
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    // !----------------------------Blog----------------------------------
    app.post("/blog", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });
    // all-get-admin
    app.get("/blog", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    // all-get-volunteer
    app.get("/blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    //!----------------------------Users-AUTH----------------------------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // !MAKE-ADMIN--------****
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });
    // -------------------
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // !---make-Volunteer-----***
    app.get("/users/volunteer/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let volunteer = false;
      if (user) {
        volunteer = user?.role === "volunteer";
      }
      res.send({ volunteer });
    });
    // -------------------
    app.patch("/users/volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "volunteer",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // !------------------------------Recipient-NEED-BLOOD--------------------------

    app.post("/recipient", async (req, res) => {
      const recipientUser = req.body;
      const result = await recipientCollection.insertOne(recipientUser);
      res.send(result);
    });
    //------- limit----
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
    app.get("/MyDonations", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = recipientCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/DonationRequrestAdmin", async (req, res) => {
      const result = await recipientCollection.find().toArray();
      res.send(result);
    });
    // all-get
    app.get("/DonationRequrest", async (req, res) => {
      const result = await recipientCollection.find().toArray();
      res.send(result);
    });
    app.get("/DonationRequrests", async (req, res) => {
      const result = await recipientCollection.find().toArray();
      res.send(result);
    });
    //  ----------------------Delete Item---------------------
    //  --my-donation-delete---
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
    // -----admin-delete-----
    app.get("/donationDeletee", async (req, res) => {
      const cursor = recipientCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.delete("/donationDeletee/:id", async (req, res) => {
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
    //  ----------------------Update Donation Status----------------------------
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
    //  update-Status---------------------
    app.put("/DonationUpStatus/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: { status: "inprogress" },
      };

      const result = await recipientCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      res.send(result);
    });
    // ----------------------Update Donation Status----------------------------
    app.put("/upDonationStatus/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = { $set: { status } };
      const result = await recipientCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // admin-update-Status---------------------
    app.put("/upDonationStatuss/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = { $set: { status } };
      const result = await recipientCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // ----------------------------------------Details---------------------------------------
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipientCollection.findOne(query);
      res.send(result);
    });
    // !--------------------------Donor------------------------------------
    app.post("/donor", async (req, res) => {
      const user = req.body;
      const result = await donorCollection.insertOne(user);
      res.send(result);
    });

    // all-get
    app.get("/donor", async (req, res) => {
      const result = await donorCollection.find().toArray();
      res.send(result);
    });
    // !----------------------------------Search Donor--------------------------------
    app.get("/searchDonor", async (req, res) => {
      const { District, Upazila, Blood } = req.query;
      const query = {};
      if (District) query.District = District;
      if (Upazila) query.Upazila = Upazila;
      if (Blood) query.Blood = Blood;
      const donors = await donorCollection.find(query).toArray();
      res.json(donors);
    });
    // !--------------------------fund------------------------------------
    app.post("/fund", async (req, res) => {
      const fund = req.body;
      const result = await fundCollection.insertOne(fund);
      res.send(result);
    });
    // all-get
    app.get("/fund", async (req, res) => {
      const result = await fundCollection.find().toArray();
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
