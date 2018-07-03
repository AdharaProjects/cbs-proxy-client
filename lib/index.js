const fetch = require('node-fetch')

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
const getOmnibusAccountIdUri = baseUrl => baseUrl + '/cbs/getOmnibusAccountId'
const getOmnibusAccountIdOption = sessionToken => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken
  })
})
const transfersUri = baseUrl => baseUrl + '/cbs/transfers'
const transfersOption = (sessionToken, accountId, queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken,
    accountId,
    queryParameters
  })
})

// NOTE: I chose to use a functor like constructor with closures rather than classes because I don't like needing to call `new`
const createTokenProxy = async (username, password, url) => {
  const sessionToken = (
    await fetchJson(
      getAuthUri(url),
      getAuthOptions(username, password)
    )
  ).sessionToken

  const omnibusAccountId = (
    await fetchJson(
      getOmnibusAccountIdUri(url),
      getOmnibusAccountIdOption(sessionToken)
    )
  ).omnibusAccountId

  const getOmnibusCredits = async (fromTime) => {
    const transfers = (
      await fetchJson(
        transfersUri(url),
        transfersOption(sessionToken, omnibusAccountId, {datePeriod: {fromTime}})
      )
    )
    return transfers
  }

  return {
    getOmnibusCredits
  }
}

module.exports = createTokenProxy
