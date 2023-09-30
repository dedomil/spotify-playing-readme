require("dotenv").config();

let config = {
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  redirectUrl: process.env.REDIRECTURL,
  userId: process.env.USERID,
}

module.exports = config;