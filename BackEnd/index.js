const express = require("express");
const app = express();
const path = require("path");
const db = require(path.join(__dirname, "models"));
const dbConfig = require(path.join(__dirname, "config", "db-config.js"));

(async () => {
  await db.sequelize.sync();
})();

app.listen(dbConfig.PORT);
