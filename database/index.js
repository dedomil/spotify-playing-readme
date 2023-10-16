const { userId, detakey } = require("../config.js");
const deta = require("deta").Deta(detakey);
const db = deta.Base(userId);
module.exports = db;