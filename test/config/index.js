const fs = require('fs')
// const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'))
const config = require('./config.json')

module.exports = {
  cyclosUrl: process.env.CBS_SERVER_ADDRESS || config.cyclosUrl,
  cbsProxyUrl: process.env.CBS_PROXY_URL || config.cbsProxyUrl,
  cbsUnameAdmin: process.env.ADMIN_UNAME || config.cbsUnameAdmin,
  cbsPasswordAdmin: process.env.ADMIN_PASSWORD || config.cbsPasswordAdmin,
  cbsUnameUser1: process.env.USER1_UNAME || config.cbsUnameUser1,
  cbsPasswordUser1: process.env.USER1_PASSWORD || config.cbsPasswordUser1,
  cbsAccountUser1: process.env.USER1_ACCOUNT || config.cbsAccountUser1,
}
