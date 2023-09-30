const express = require("express");
const axios = require("axios");
const qs = require("qs");
const { clientId, clientSecret, userId, redirectUrl } = require("./config.js");
const checkAccessTokenExpiry = require("./middlewares/checkAccessTokenExpiry.js");
const db = require("./database/database.js");

const app = express();

app.get("/login", async ({ res }) => {
  try {
    res.redirect(`https://accounts.spotify.com/authorize?${qs.stringify({
      "client_id": clientId,
      "response_type": "code",
      "scope": "user-read-currently-playing",
      "redirect_uri": redirectUrl,
    })}`);
  } catch ({ message }) {
    res.status(500).send({ message })
  }
})

app.get("/callback", async (req, res) => {
  try {
    let { code } = req.query;
    if (!code) res.status(401).send({ message: "authorization error" });
    let { data: { access_token, refresh_token, expires_in } } = await axios.request({
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
      },
      data: qs.stringify({
        code,
        "redirect_uri": redirectUrl,
        "grant_type": "authorization_code"
      }),
    });
    await db.put({
      key: userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Math.round((Date.now() / 1000) + expires_in - 20)
    })
    res.redirect("/")
  } catch ({ message }) {
    res.status(500).send({ message })
  }
})

app.get("/", checkAccessTokenExpiry, async (req, res) => {
  try {
    let { data } = await axios.request({
      url: "https://api.spotify.com/v1/me/player/currently-playing",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${req.accessToken}`
      }
    });
    res.send({ ...data });
  } catch ({ message }) {
    res.redirect({ message });
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`running on port ${process.env.PORT || 3000}`);
});
