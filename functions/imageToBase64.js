const axios = require("axios");

module.exports = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data,).toString('base64');
  } catch (err) {
    console.log(err);
  }
}
