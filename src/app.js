const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { db } = require("./db");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const generateShortCode = () => {
  return crypto.randomBytes(4).toString("base64url");
};

const insertLink = (originalUrl) =>
  new Promise((resolve, reject) => {
    const shortCode = generateShortCode();
    const createdAt = new Date().toISOString();

    db.run(
      "INSERT INTO links (short_code, original_url, created_at) VALUES (?, ?, ?)",
      [shortCode, originalUrl, createdAt],
      function handleInsert(err) {
        if (err && err.message.includes("UNIQUE")) {
          return resolve(insertLink(originalUrl));
        }
        if (err) {
          return reject(err);
        }
        return resolve({ id: this.lastID, shortCode });
      }
    );
  });

app.post("/api/links", async (req, res) => {
  const { url } = req.body || {};
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const { shortCode } = await insertLink(url);
    const shortUrl = `${req.protocol}://${req.get("host")}/${shortCode}`;
    return res.status(201).json({ shortCode, shortUrl });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create short link" });
  }
});

app.get("/api/links/:shortCode/stats", (req, res) => {
  const { shortCode } = req.params;
  db.get(
    `SELECT links.id as id, links.short_code as shortCode, links.original_url as originalUrl,
      COUNT(clicks.id) as clickCount,
      MAX(clicks.clicked_at) as lastClickedAt
     FROM links
     LEFT JOIN clicks ON clicks.link_id = links.id
     WHERE links.short_code = ?
     GROUP BY links.id`,
    [shortCode],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Unable to fetch stats" });
      }
      if (!row) {
        return res.status(404).json({ error: "Short code not found" });
      }
      return res.json({
        shortCode: row.shortCode,
        originalUrl: row.originalUrl,
        clickCount: row.clickCount,
        lastClickedAt: row.lastClickedAt,
      });
    }
  );
});

app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;
  db.get(
    "SELECT id, original_url FROM links WHERE short_code = ?",
    [shortCode],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Unable to resolve short code" });
      }
      if (!row) {
        return res.status(404).json({ error: "Short code not found" });
      }

      const clickedAt = new Date().toISOString();
      db.run(
        "INSERT INTO clicks (link_id, clicked_at) VALUES (?, ?)",
        [row.id, clickedAt],
        (clickErr) => {
          if (clickErr) {
            return res.status(500).json({ error: "Unable to record click" });
          }
          return res.redirect(302, row.original_url);
        }
      );
    }
  );
});

module.exports = { app };
