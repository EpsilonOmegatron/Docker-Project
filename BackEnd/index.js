const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const app = express();
app.use(express.json()); // Parses body to json
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "secretstring" }));
app.set("view engine", "ejs");

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
  if (req.session.loggedIn) {
    res.redirect(`/user/${req.session.username}`);
  } else {
    res.render("pages/index");
  }
});

/////////////////////////////////////

//////// Login-Signup-Logout routes ////////

app.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect(`/user/${req.session.username}`);
  } else {
    res.render("pages/login");
  }
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
        res.redirect(`/user/${req.session.username}`);
      } else {
        res.send(
          `Incorrect Username and/or Password. <a href="/">Return to homepage.</a>`
        );
      }
    }
  );
});

app.get("/signup", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect(`/user/${req.session.username}`);
  } else {
    res.render("pages/signup");
  }
});

app.post("/signup", (req, res) => {
  db.query(
    `INSERT INTO user (username, password, role) 
     VALUES("${req.body.username}", "${req.body.password}", "${req.body.role}")`,
    (err) => {
      if (err) {
        res.redirect("/signup");
      } else {
        res.status(200);
        res.redirect("/");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy();
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

/////////////////////////////////////

//////// User - Logic Routes ////////

app.get(`/user/:username`, (req, res) => {
  if (req.session.role == "Doctor") {
    res.sendFile(path.join(__dirname + "/static/html/doctor.html"));
  } else if (req.session.role == "Patient") {
    res.sendFile(path.join(__dirname + "/static/html/patient.html"));
  } else {
    res.redirect("/");
  }
});

/////////////////////////////////////

//////// Begin App ////////

app.listen(appPort, () => {
  console.log(`Listening on ${appPort}`);
});

/////////////////////////////////////
