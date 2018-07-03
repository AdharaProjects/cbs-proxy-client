const fs = require('fs')
// const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'))
const config = require('./config.json')

module.exports = {
  cyclosUrl: process.env.CBS_SERVER_ADDRESS || config.cyclosUrl,
  cbsProxyUrl: process.env.CBS_PROXY_URL || config.cbsProxyUrl
}
