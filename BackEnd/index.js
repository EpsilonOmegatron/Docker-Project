require("dotenv").config;
const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const app = express();
app.use(express.json()); // Parses request body to json
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "secretstring" }));
app.set("view engine", "ejs");

//////// Database Setup + Initialization ////////

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost", // Configure Host here
  user: process.env.DB_USER || "admin", // Configure your MySQL username here
  password: process.env.DB_PASSWORD || "1234", // Configure your MySQL password here
  port: process.env.DB_PORT || "3306", //Configure your MySQL port here
});
const appAddress = process.env.APP_ADDRESS || "127.0.0.1"
const appPort = process.env.APP_PORT || 1234; // The port the application will be running on

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
    username VARCHAR(255) NOT NULL UNIQUE, 
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
    patientID INT NOT NULL REFERENCES user(id),
    slotID INT NOT NULL UNIQUE REFERENCES doctorslot(id)
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
    doctorID INT NOT NULL REFERENCES user(id),
    doctorName VARCHAR(255) NOT NULL, 
    date DATE NOT NULL,
    time TIME NOT NULL
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
        req.session.unique = result[0].id;
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

// User Main Page
app.get(`/user/:username`, (req, res) => {
  if (req.session.role == "Doctor") {
    db.query(
      `SELECT id, DATE_FORMAT(date, '%Y/%m/%e') AS date, TIME_FORMAT(time, '%r') AS time FROM doctorslot WHERE doctorID = ${req.session.unique}`,
      (err, result) => {
        const queryResults = result;
        res.render("pages/doctor", {
          username: req.session.username,
          results: queryResults,
        });
      }
    );
  } else if (req.session.role == "Patient") {
    res.render("pages/patient", {
      username: req.session.username,
    });
  } else {
    res.redirect("/");
  }
});

// Doctor Insert Slot
app.post(`/user/:username`, (req, res) => {
  if (req.session.role == "Doctor") {
    db.query(
      `INSERT INTO doctorslot (doctorID, doctorName, date, time) VALUES (${req.session.unique}, "${req.session.username}", "${req.body.date}", "${req.body.time}")`,
      (err, result) => {
        if (err) {
          res.send(err);
        } else {
          res.redirect(`/user/:username`);
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

// User Delete Slot
app.get("/user/delete/:id", (req, res) => {
  if (req.session.role == "Doctor") {
    db.query(
      `DELETE FROM doctorslot WHERE doctorslot.id = ${req.params.id}`,
      (err, result) => {
        if (err) {
          res.send(err);
        } else {
          res.redirect("/user/:username");
        }
      }
    );
  } else if (req.session.role == "Patient") {
    db.query(
      `DELETE FROM doctorslot WHERE id = ${req.params.id}`,
      (err, result) => {
        if (err) {
          res.send(err);
        }
      }
    );
    db.query(`DELETE FROM slot WHERE id = ${req.params.id}`, (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.redirect("/user/:username/reservations");
      }
    });
  } else {
    res.redirect("/");
  }
});

// Patient Add Slot
app.get(`/user/:username/add`, (req, res) => {
  if (req.session.role == "Patient") {
    db.query(`SELECT DISTINCT doctorName from doctorslot`, (err, result) => {
      const queryResults = result;
      res.render("pages/patientAddSlot", {
        username: req.session.username,
        doctors: queryResults,
        results: [],
      });
    });
  } else {
    res.redirect("/");
  }
});

app.post(`/user/:username/add`, (req, res) => {
  if (req.session.role == "Patient") {
    var doctorResult;
    db.query(`SELECT DISTINCT doctorName from doctorslot`, (err, result) => {
      doctorResult = result;
    });
    db.query(
      `SELECT id, DATE_FORMAT(date, '%Y/%m/%e') AS date, TIME_FORMAT(time, '%r') AS time FROM doctorslot WHERE doctorName = "${req.body.doctors}"`,
      (err, result) => {
        res.render("pages/patientAddSlot", {
          username: req.session.username,
          doctors: doctorResult,
          results: result,
        });
      }
    );
  }
});

app.get(`/user/add/:id`, (req, res) => {
  if (req.session.role == "Patient") {
    db.query(
      `INSERT INTO slot (patientID, slotID) values (${req.session.unique}, ${req.params.id})`,
      (err, result) => {
        if (err) {
          res.send(err);
        } else {
          res.redirect("/user/:username/reservations");
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

// Patient Show Reservations
app.get(`/user/:username/reservations`, (req, res) => {
  if (req.session.role == "Patient") {
    db.query(
      `SELECT DISTINCT doctorslot.id AS id, DATE_FORMAT(date, '%Y/%m/%e') AS date, TIME_FORMAT(time, '%r') AS time, doctorName FROM doctorslot, slot, user WHERE doctorslot.id = slot.slotID AND slot.patientID = ${req.session.unique}`,
      (err, result) => {
        const queryResults = result;
        res.render("pages/patientReservations", {
          username: req.session.username,
          results: queryResults,
        });
      }
    );
  } else {
    res.redirect("/");
  }
});

/////////////////////////////////////

//////// Begin App ////////

app.listen(appPort, appAddress, () => {
  console.log(`Listening on ${appPort} at ${appAddress}`);
});

/////////////////////////////////////
// `SELECT id, DATE_FORMAT(date, '%Y/%m/%e') AS date, TIME_FORMAT(time, '%r') AS time FROM doctorslot WHERE doctorName = ${req.body.doctors}`
