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

const getPrimaryAccountIdUri = baseUrl => baseUrl + '/cbs/getPrimaryAccountId'
const getPrimaryAccountIdOption = sessionToken => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken
  })
})

const getUserIdUri = baseUrl => baseUrl + '/cbs/getUserId'
const getUserIdOption = sessionToken => ({
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

const makeTransferToPrimaryAccountUri = baseUrl => baseUrl + '/cbs/transferToAdminPrimaryAccount'
const makeTransferFromPrimaryAccountUri = baseUrl => baseUrl + '/cbs/transferFromAdminPrimaryAccount'
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

  const primaryAccountId = (
    await fetchJson(
      getPrimaryAccountIdUri(url),
      getPrimaryAccountIdOption(sessionToken)
    )
  ).primaryAccountId

  const getTransfersToPrimaryAccount = async (fromTime) => {
    const transfers = (
      await fetchJson(
        transfersUri(url),
        transfersOption(sessionToken, primaryAccountId, {datePeriod: {fromTime}, direction: 'credit'})
      )
    )
    return transfers
  }

  const getTransfersFromPrimaryAccount = async (fromTime) => {
    const transfers = (
      await fetchJson(
        transfersUri(url),
        transfersOption(sessionToken, primaryAccountId, {datePeriod: {fromTime}, direction: 'debit'})
      )
    )
    return transfers
  }

  const makeTransferToAdminPrimaryAccount = async (amount, message) => {
    const transferResult = (
      await fetchJson(
        makeTransferToPrimaryAccountUri(url),
        makeTransferOption({sessionToken, amount, message})
      )
    )
    return transferResult
  }

  const makeTransferFromAdminPrimaryAccount = async (amount, message, accountId) => {
    const transferResult = (
      await fetchJson(
        makeTransferFromPrimaryAccountUri(url),
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
        getAccountDetailsOption({sessionToken, accountId: primaryAccountId})
      )
    )
    return transferResult
  }

  return {
    getTransfersToPrimaryAccount,
    getTransfersFromPrimaryAccount,
    makeTransferToAdminPrimaryAccount,
    makeTransferFromAdminPrimaryAccount,
    getAccountDetails
  }
}

module.exports = createTokenProxy
