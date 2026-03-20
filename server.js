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


app.get("/users", (req, res) => {
  const query = `
    SELECT id, user_id, first_name, username, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
      return;
    }
    res.json(result);
  });
});




// Get all rules
app.get("/rules", (req, res) => {
  const query = `
    SELECT id, user_id, source_chat_id, destination_chat_ids,
           is_active, filter_types, blacklist_keywords, delay_seconds,
           whitelist_keywords, replace_pairs, header_text, footer_text
    FROM rules
    ORDER BY id DESC
  `;
  db.query(query, (err, result) => {
    if (err) { console.error(err); res.status(500).json({ error: "Database error" }); return; }
    res.json(result);
  });
});

// Toggle is_active for a rule
app.patch("/rules/:id/toggle", (req, res) => {
  const { id } = req.params;
  db.query("SELECT is_active FROM rules WHERE id = ?", [id], (err, result) => {
    if (err || result.length === 0) { res.status(404).json({ error: "Rule not found" }); return; }
    const newStatus = result[0].is_active ? 0 : 1;
    db.query("UPDATE rules SET is_active = ? WHERE id = ?", [newStatus, id], (err2) => {
      if (err2) { res.status(500).json({ error: "Database error" }); return; }
      res.json({ id, is_active: newStatus });
    });
  });
});

// Filter types breakdown for dashboard chart
app.get("/filter-types-breakdown", (req, res) => {
  const query = `SELECT filter_types FROM rules WHERE filter_types IS NOT NULL AND filter_types != ''`;
  db.query(query, (err, result) => {
    if (err) { res.status(500).json({ error: "Database error" }); return; }
    const counts = {};
    result.forEach(row => {
      (row.filter_types || "").split(",").forEach(type => {
        const t = type.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    res.json(data);
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});