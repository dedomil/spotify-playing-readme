const qs = require("qs");
const axios = require("axios");
const { clientId, clientSecret, userId } = require("../config.js");
const db = require("../database/index.js");

const checkAccessTokenExpiry = async (req, res, next) => {
  try {
    let { accessToken, refreshToken, expiresAt } = await db.get(userId);
    if (expiresAt <= Math.round(Date.now() / 1000)) {
      // accessToken expired, generate new access token using refresh token
      let { data: { access_token, expires_in } } = await axios.request({
        url: "https://accounts.spotify.com/api/token",
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
        },
        data: qs.stringify({
          "refresh_token": refreshToken,
          "grant_type": "refresh_token"
        })
      });
      // put new accessToken in database
      await db.put({
        key: userId,
        accessToken: access_token,
        refreshToken,
        expiresAt: Math.round((Date.now() / 1000) + expires_in - 20)
      })
      req.accessToken = access_token;
      next();
    } else {
      // accessToken not expired, send from database as it is
      req.accessToken = accessToken;
      next();
    }
  } catch (error) {
    res.status(401).send({ message: "try to login, refresh token isnt valid" });
  }
}

module.exports = checkAccessTokenExpiry;
