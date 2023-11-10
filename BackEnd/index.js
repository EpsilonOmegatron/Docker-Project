const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//////// Root ////////

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/static/html/index.html"));
});

/////////////////////////////////////

//////// Login-Signup routes ////////

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname + "/static/html/login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname + "/static/html/signup.html"));
});

app.post("/signup", (req, res) => {
  console.log(req.body);
});

/////////////////////////////////////

app.listen(1234);
