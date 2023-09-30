const { userId } = require("../config.js");
const deta = require("deta").Deta();
const db = deta.Base(userId);
module.exports = db;