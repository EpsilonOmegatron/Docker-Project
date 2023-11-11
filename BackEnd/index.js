const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const app = express();
app.use(express.json()); // Parses body to json
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "secretstring" }));

//////// Database Setup + Initialization ////////

const db = mysql.createConnection({
  host: "localhost",
  user: "admin",
  password: "1234",
});
const appPort = 1234;

db.query("CREATE DATABASE clinicapp", (err) => {
  if (err) {
    console.log("Database already exists.");
  } else {
    console.log("Database created successfully.");
  }
});

db.query("USE clinicapp");

db.query(
  `CREATE TABLE user
  (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(255) NOT NULL unique, 
    password VARCHAR(255) NOT NULL, 
    role VARCHAR(50) NOT NULL
  )`,
  (err) => {
    if (err) {
      console.log("Table already exists.");
    } else {
      console.log("Table User created successfully.");
    }
  }
);

db.query(
  `CREATE TABLE slot
  (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    patientID INT NOT NULL UNIQUE REFERENCES user(id),
    slotID INT NOT NULL UNIQUE REFERENCES slot(id)
  )`,
  (err) => {
    if (err) {
      console.log("Table already exists.");
    } else {
      console.log("Table Slot created successfully.");
    }
  }
);

db.query(
  `CREATE TABLE doctorslot
  (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    doctorID INT NOT NULL UNIQUE REFERENCES user(id), 
    date DATETIME NOT NULL
  )`,
  (err) => {
    if (err) {
      console.log("Table already exists.");
    } else {
      console.log("Table DoctorSlot created successfully.");
    }
  }
);

/////////////////////////////////////

//////// Root ////////

app.get("/", (req, res) => {
  if (req.session.username) {
    res.redirect("/home");
  } else {
    res.sendFile(path.join(__dirname + "/static/html/index.html"));
  }
});

/////////////////////////////////////

//////// Login-Signup-Logout routes ////////

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname + "/static/html/login.html"));
});

app.post("/auth", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  db.query(
    "SELECT * FROM user WHERE username = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        req.session.loggedIn = true;
        req.session.username = username;
        req.session.role = result[0].role;
        res.redirect(`/home/${username}`);
      } else {
        res.send(
          `Incorrect Username and/or Password. <a href="/">Return to homepage.</a>`
        );
      }
    }
  );
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname + "/static/html/signup.html"));
});

app.post("/signup", (req, res) => {
  db.query(
    `INSERT INTO user (username, password, role) 
     VALUES("${req.body.username}", "${req.body.password}", "${req.body.role}")`,
    (err) => {
      if (err) {
        res.redirect(409, "/signup");
      } else {
        res.status(200);
        res.send("Signup success!");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  if (req.session.username) {
    req.session.destroy();
    res.send("logout success!");
  }
  res.redirect("/");
});

/////////////////////////////////////

//////// Begin App ////////

app.listen(appPort, () => {
  console.log(`Listening on ${appPort}`);
});

/////////////////////////////////////
