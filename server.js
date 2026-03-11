const express = require("express");
const db = require("./db");

const app = express();

app.get("/", (req, res) => {
  res.send("Forward Bot Admin API Running");
});

app.get("/stats", (req, res) => {
  const stats = {};

  db.query("SELECT COUNT(*) AS total FROM users", (err, result) => {
    stats.users = result[0].total;

    db.query("SELECT COUNT(*) AS total FROM rules", (err, result) => {
      stats.rules = result[0].total;

      db.query("SELECT COUNT(*) AS total FROM message_map", (err, result) => {
        stats.messages = result[0].total;

        db.query(
          "SELECT COUNT(*) AS total FROM message_map WHERE DATE(created_at) = CURDATE()",
          (err, result) => {
            stats.messages_today = result[0].total;
            res.json(stats);
          }
        );
      });
    });
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});