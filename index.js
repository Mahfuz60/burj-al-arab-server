const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);

const port = 5000;
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wmpww.mongodb.net/Burj-al-Arab?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// firebase admin part
const admin = require("firebase-admin");

const serviceAccount = require("./configs/burj-al-arab-63160-firebase-adminsdk-3tzqk-3791d5c32d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("Burj-al-Arab").collection("Bookings");
  console.log("DB-connection successfully");

  //  create data
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;

    bookings.insertOne(newBooking).then((result) => {
      // console.log(result)
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  // read data

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      //  console.log({idToken});
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail,queryEmail)
          if (tokenEmail == req.query.email) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          } else {
            res.status(401).send("un-Authorized User!Please try again");
          }
        })
        .catch((error) => {
          // Handle error
          res.status(401).send("un-Authorized User!Please try again");
        });
    } else {
      res.status(401).send("un-Authorized User!Please try again");
    }
  });
});

app.listen(port);
