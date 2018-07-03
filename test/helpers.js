const fetch = require('node-fetch')
const config = require('./config')

const fetchJson = async (uri, options) => await (await fetch(uri, options)).json()
const fetchOptionsTemplate = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}
const getAuthUri = baseUrl => baseUrl + '/cbs/getAuth'
const getAuthOptions = (username, password) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    username,
    password
  })
})
const makeTransferToOmnibusUri = config.cyclosUrl +  '/api/self/payments?fields=id&fields=authorizationStatus'
const makeTransferToOmnibusOption = (sessionToken, transferDataBody) => ({
  ...fetchOptionsTemplate,
  headers: {
    ...fetchOptionsTemplate.headers,
    'Session-Token': sessionToken,
  },
  body: JSON.stringify(transferDataBody)
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO: make these transfers random in value
const makeRandomTransfersToOmnibusAccount = async (numberOfTransfers, sessionToken) => {
  let transferArray = []
  let timestamp
  for(let i = 0; i < numberOfTransfers; ++i) {
    timestamp = new Date() / 1000
    const transferDetails = {amount:'1.0' + i, description:"randomTest #"+i, type:"user.toOrganization", subject:"system"}
    let txId = await fetchJson(makeTransferToOmnibusUri ,makeTransferToOmnibusOption(sessionToken, transferDetails))
    transferArray = [...transferArray, {timestamp, txId, transferDetails}]
  }
  await sleep(2000)
  return transferArray
}
const getSessionToken = async (username, password, url) => {
  const sessionToken = (
    await fetchJson(
      getAuthUri(url),
      getAuthOptions(username, password)
    )
  ).sessionToken
  return sessionToken
}

module.exports= {
  getSessionToken,
  makeRandomTransfersToOmnibusAccount,
  sleep
}
