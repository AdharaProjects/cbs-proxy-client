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
const getSessionTokenPure = async (username, password, url) => (
  await fetchJson(
    getAuthUri(url),
    getAuthOptions(username, password)
  )
).sessionToken

const getPrimaryAccountIdUri = baseUrl => baseUrl + '/cbs/getPrimaryAccountId'
const getPrimaryAccountIdOption = sessionToken => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken
  })
})
const getPrimaryAccountIdPure = async (sessionToken, url) => (
  await fetchJson(
    getPrimaryAccountIdUri(url),
    getPrimaryAccountIdOption(sessionToken)
  )
).primaryAccountId

const getUserIdUri = baseUrl => baseUrl + '/cbs/getUserId'
const getUserIdOption = sessionToken => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken
  })
})
const getUserIdPure = async (sessionToken, url) => (
  await fetchJson(
    getUserIdUri(url),
    getUserIdOption(sessionToken)
  )
).userId

const transfersUri = baseUrl => baseUrl + '/cbs/transfers'
const transfersOption = (sessionToken, accountId, queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken,
    accountId,
    queryParameters
  })
})

const getTransfersToPrimaryAccountPure = async (sessionToken, primaryAccountId, url, fromTime) => {
  const transfers = (
    await fetchJson(
      transfersUri(url),
      transfersOption(sessionToken, primaryAccountId, {datePeriod: {fromTime}, direction: 'credit'})
    )
  )
  return transfers
}

const getTransfersFromPrimaryAccountPure = async (sessionToken, primaryAccountId, url, fromTime) => {
  const transfers = (
    await fetchJson(
      transfersUri(url),
      transfersOption(sessionToken, primaryAccountId, {datePeriod: {fromTime}, direction: 'debit'})
    )
  )
  return transfers
}

const makeTransferToPrimaryAccountUri = baseUrl => baseUrl + '/cbs/transferToAdminPrimaryAccount'
const makeTransferFromPrimaryAccountUri = baseUrl => baseUrl + '/cbs/transferFromAdminPrimaryAccount'
const makeTransferOption = (queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify(queryParameters)
})

const makeTransferToAdminPrimaryAccountPure = async (sessionToken, primaryAccountId, url, amount, message) => {
  const transferResult = (
    await fetchJson(
      makeTransferToPrimaryAccountUri(url),
      makeTransferOption({sessionToken, amount, message})
    )
  )
  return transferResult
}

const makeTransferFromAdminPrimaryAccountPure = async (sessionToken, primaryAccountId, url, amount, message, accountId) => {
  const transferResult = (
    await fetchJson(
      makeTransferFromPrimaryAccountUri(url),
      makeTransferOption({sessionToken, amount, message, accountId})
    )
  )
  return transferResult
}

const getAccountDetailsUri = baseUrl => baseUrl + '/cbs/accountSummary'
const getAccountDetailsOption = (queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify(queryParameters)
})
// TODO:: could add time based filtering in the future
const getAccountDetailsPure = async (sessionToken, primaryAccountId, url) => {
  const transferResult = (
    await fetchJson(
      getAccountDetailsUri(url),
      getAccountDetailsOption({sessionToken, accountId: primaryAccountId})
    )
  )
  return transferResult
}

const getAccountListUri = baseUrl => baseUrl + '/cbs/getAccountsList'
const getAccountListOption = (queryParameters) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify(queryParameters)
})
const getAccountsListPure = async (sessionToken, url) => {
  const transferResult = (
    await fetchJson(
      getAccountListUri(url),
      getAccountListOption({sessionToken})
    )
  )
  return transferResult
}

const getAccountBalancesUri = baseUrl => baseUrl + '/cbs/accountBalances'
const getAccountBalancesOptions = (sessionToken, accountType) => ({
  ...fetchOptionsTemplate,
  body: JSON.stringify({
    sessionToken,
    accountType
  })
})
const getAccountBalancesPure = async (sessionToken, accountType, url) => {
  const transferResult = (
    await fetchJson(
      getAccountBalancesUri(url),
      getAccountBalancesOptions({sessionToken, accountType})
    )
  )
  return transferResult
}


// NOTE: I chose to use a functor like constructor with closures rather than classes because I don't like needing to call `new`
const createCbsProxyObject = async (username, password, url) => {

  const sessionToken = await getSessionTokenPure(username, password, url)
  const primaryAccountId = await getPrimaryAccountIdPure(sessionToken, url)
  const userId = await getUserIdPure(sessionToken, url)

  // Member functions:

  const getTransfersToPrimaryAccount = (fromTime) => getTransfersToPrimaryAccountPure(sessionToken, primaryAccountId, url, fromTime)

  const getTransfersFromPrimaryAccount = (fromTime) => getTransfersFromPrimaryAccountPure(sessionToken, primaryAccountId, url, fromTime)

  const makeTransferToAdminPrimaryAccount = (amount, message) => makeTransferToAdminPrimaryAccountPure(sessionToken, primaryAccountId, url, amount, message)

  const makeTransferFromAdminPrimaryAccount = (amount, message, accountId) => makeTransferFromAdminPrimaryAccountPure(sessionToken, primaryAccountId, url, amount, message, accountId)

  const getAccountDetails = () => getAccountDetailsPure(sessionToken, primaryAccountId, url)

  const getAccountsList = () => getAccountsListPure(sessionToken, url)

  const getPrimaryAccountId = () => primaryAccountId

  const getUserId = () => userId

  const getSessionToken = () => sessionToken

  const getAccountBalances = (accountType) => getAccountBalancesPure(sessionToken, accountType, url)

  return {
    getTransfersToPrimaryAccount,
    getTransfersFromPrimaryAccount,
    makeTransferToAdminPrimaryAccount,
    makeTransferFromAdminPrimaryAccount,
    getAccountDetails,
    getPrimaryAccountId,
    getUserId,
    getSessionToken,
    getAccountsList,
    getAccountBalances
  }
}

module.exports = {
  createCbsProxyObject,
  getTransfersToPrimaryAccountPure,
  getTransfersFromPrimaryAccountPure,
  makeTransferToAdminPrimaryAccountPure,
  makeTransferFromAdminPrimaryAccountPure,
  getAccountDetailsPure,
  getPrimaryAccountIdPure,
  getUserIdPure,
  getSessionTokenPure,
  getAccountsListPure,
  getAccountBalancesPure
}
