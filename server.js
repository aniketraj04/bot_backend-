const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());

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

app.get("/messages-per-day", (req, res) => {

    const query = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM message_map
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.json(result);
    });

});


app.get("/recent-activity", (req, res) => {

    const query = `
        SELECT source_chat_id, destination_chat_id, created_at
        FROM message_map
        ORDER BY created_at DESC
        LIMIT 10
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.json(result);
    });

});

app.get("/top-channels", (req, res) => {

    const query = `
        SELECT source_chat_id, COUNT(*) AS total
        FROM message_map
        GROUP BY source_chat_id
        ORDER BY total DESC
        LIMIT 5
    `;

    db.query(query, (err, result) => {

        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.json(result);

    });

});

app.get("/user-growth", (req, res) => {

    const query = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    `;

    db.query(query, (err, result) => {

        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.json(result);

    });

});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});