const express = require("express");
const axios = require("axios");
const qs = require("qs");
const fs = require("fs");

const { clientId, clientSecret, userId, redirectUrl, loginSecret } = require("./config.js");
const { checkAccessTokenExpiry } = require("./middlewares");
const { generateBars, imageToBase64 } = require("./functions");
const db = require("./database");

const app = express();
app.set("view engine", "ejs");

app.get("/login", async (req, res) => {
  try {
    let { secret } = req.query;
    if (!secret && secret != loginSecret) return res.send({ message: "please enter valid login secret" });
    res.redirect(`https://accounts.spotify.com/authorize?${qs.stringify({
      "client_id": clientId,
      "response_type": "code",
      "scope": "user-read-currently-playing,user-read-recently-played",
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
    let { spin, scan, theme, rainbow } = req.query;
    let { data } = await axios.request({
      url: "https://api.spotify.com/v1/me/player/currently-playing",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${req.accessToken}`
      }
    });
    let item, cover;
    if (Object.keys(data).length != 0) {
      item = data.item;
    } else {
      let { data: { items } } = await axios.request({
        url: "https://api.spotify.com/v1/me/player/recently-played?limit=1",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${req.accessToken}`
        }
      });
      item = items[0].track;
    }
    if (item.album.images.length != 0) {
      cover = await imageToBase64(item.album.images[1].url);
    } else {
      cover = fs.readFileSync("./base64/placeholder_image.txt", { encoding: "utf-8" });
    }
    let scanCode = scan ? await imageToBase64(`https://scannables.scdn.co/uri/plain/png/000000/white/640/${item.uri}`) : "";
    res.set("content-type", "image/svg+xml");
    res.set("cache-control", "max-age=0, no-cache, no-store, must-revalidate");
    res.render("spotify", {
      spin,
      scan,
      theme,
      rainbow,
      scanCode,
      cover,
      id: item.id,
      name: item.name,
      barCount: scan ? 10 : 12,
      artist: item.artists[0].name,
      bars: generateBars(scan ? 10 : 12, rainbow),
      logo: fs.readFileSync("./base64/spotify_logo.txt", { encoding: "utf-8" })
    });
  } catch ({ message }) {
    res.status(500).send({ message });
  }
})

app.get("/play", checkAccessTokenExpiry, async (req, res) => {
  try {
    let item;
    let { data } = await axios.request({
      url: "https://api.spotify.com/v1/me/player/currently-playing",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${req.accessToken}`
      }
    });
    if (Object.keys(data).length != 0) {
      item = data.item;
    } else {
      let { data: { items } } = await axios.request({
        url: "https://api.spotify.com/v1/me/player/recently-played?limit=1",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${req.accessToken}`
        }
      });
      item = items[0].track;
    }
    res.redirect(item.external_urls.spotify || "https://open.spotify.com/");
  } catch ({ message }) {
    res.status(500).send({ message });
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`running on port ${process.env.PORT || 3000}`);
});
