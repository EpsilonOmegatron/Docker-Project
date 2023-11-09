const express = require("express");
const app = express();
const path = require("path");
const db = require(path.join(__dirname, "models"));

(async () => {
  await db.sequelize.sync();
})();

app.listen(1234);
