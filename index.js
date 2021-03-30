const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const admin = require("firebase-admin");
const port = 5000;
const password = "ohMyZsh1234";
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mr00a.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());

const serviceAccount = require("./configs/burj-al-arab-6c28d-firebase-adminsdk-o9g65-213b6b4fdc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");
  // perform actions on the collection object
  console.log("database connected successfully");

  // first curd: Creat data
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings
      .insertOne(newBooking)
      .then((result) => console.log(result.insertedCount > 0));
    console.log(newBooking);
  });

  // second crud: Read data
  app.get("/bookings", (req, res) => {
    console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          }
        })
        .catch((error) => {
          res.status(401).send("unauthorized access");
        });
    } else {
      res.status(401).send("unauthorized access");
    }

    // bookings.find({ email: req.query.email }).toArray((err, documents) => {
    //   res.send(documents);
    // });
  });
});

app.get("/", (req, res) => {
  res.send("Let's start the main work that we need to do");
});

app.listen(process.env.PORT || port);
