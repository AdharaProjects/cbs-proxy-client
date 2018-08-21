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
const makeTransferToOmnibusAccountUri = baseUrl => baseUrl + '/cbs/transferToOmnibus'
const makeTransferFromOmnibusAccountUri = baseUrl => baseUrl + '/cbs/transferFromOmnibus'
const makeTransferOption = (queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify(queryParameters)
})
const getAccountDetailsUri = baseUrl => baseUrl + '/cbs/accountSummary'
const getAccountDetailsOption = (queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify(queryParameters)
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

  const getTransfersToOmnibusAccount = async (fromTime) => {
    const transfers = (
      await fetchJson(
        transfersUri(url),
        transfersOption(sessionToken, omnibusAccountId, {datePeriod: {fromTime}, direction: 'credit'})
      )
    )
    return transfers
  }
  const getTransfersFromOmnibusAccount = async (fromTime) => {
    const transfers = (
      await fetchJson(
        transfersUri(url),
        transfersOption(sessionToken, omnibusAccountId, {datePeriod: {fromTime}, direction: 'debit'})
      )
    )
    return transfers
  }
  const makeTransferToOmnibusAccount = async (amount, message) => {
    const transferResult = (
      await fetchJson(
        makeTransferToOmnibusAccountUri(url),
        makeTransferOption({sessionToken, amount, message})
      )
    )
    return transferResult
  }
  const makeTransferFromOmnibusAccount = async (amount, message, accountId) => {
    const transferResult = (
      await fetchJson(
        makeTransferFromOmnibusAccountUri(url),
        makeTransferOption({sessionToken, amount, message, accountId})
      )
    )
    return transferResult
  }
  // TODO:: could add time based filtering in the future
  const getAccountDetails = async () => {
    const transferResult = (
      await fetchJson(
        getAccountDetailsUri(url),
        getAccountDetailsOption({sessionToken, accountId: omnibusAccountId})
      )
    )
    return transferResult
  }

  return {
    getTransfersToOmnibusAccount,
    getTransfersFromOmnibusAccount,
    makeTransferToOmnibusAccount,
    makeTransferFromOmnibusAccount,
    getAccountDetails
  }
}

module.exports = createTokenProxy
