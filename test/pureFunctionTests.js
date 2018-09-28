const {
  expect,
  assert
} = require('chai')
const {
  getSessionTokenPure,
  getPrimaryAccountIdPure,
  getTransfersToPrimaryAccountPure,
  getTransfersFromPrimaryAccountPure,
  getAccountDetailsPure,
  makeTransferToAdminPrimaryAccountPure,
  makeTransferFromAdminPrimaryAccountPure
} = require('../lib')
const {
  makeRandomTransfersToAdminPrimaryAccount,
  makeRandomTransfersFromAdminPrimaryAccount,
  sleep
} = require('./helpers.js')
const config = require('./config')

describe("The core banking system proxy", function() {
  this.timeout(100*1000)

  let adminProxySessionToken
  let user1ProxySessionToken
  let adminPrimaryAccountId
  let user1PrimaryAccountId

  before (async () => {
    adminProxySessionToken = await getSessionTokenPure(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
    user1ProxySessionToken = await getSessionTokenPure(config.cbsUnameUser1, config.cbsPasswordUser1, config.cbsProxyUrl)
    adminPrimaryAccountId = await getPrimaryAccountIdPure(adminProxySessionToken, config.cbsProxyUrl)
    user1PrimaryAccountId = await getPrimaryAccountIdPure(user1ProxySessionToken, config.cbsProxyUrl)
  })


  describe('getTransfersToPrimaryAccountPurePure', () => {
    let transfers

    before (async () => {
      transfers = await makeRandomTransfersToAdminPrimaryAccount(11, user1ProxySessionToken)
    })
    it("returns a list of TO transfers of the adminPrimary account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const adminPrimaryCreditsSinceTimestamp = await getTransfersToPrimaryAccountPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl, transfers[i].timestamp)
        console.log(adminPrimaryCreditsSinceTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(adminPrimaryCreditsSinceTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
    it("returns a list of FROM transfers of user account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const userDebitTrnsferSinceTimestamp = await getTransfersFromPrimaryAccountPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl, transfers[i].timestamp)
        console.log(userDebitTrnsferSinceTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(userDebitTrnsferSinceTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('getTransfersFromPrimaryAccountPure', () => {
    let transfers
    let user

    before (async () => {
      transfers = await makeRandomTransfersFromAdminPrimaryAccount(11, adminProxySessionToken)
    })
    it("returns a list of FROM transfers to the adminPrimary account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const adminPrimaryCreditsSinceTimestamp = await getTransfersFromPrimaryAccountPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl, transfers[i].timestamp)
        console.log(adminPrimaryCreditsSinceTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(adminPrimaryCreditsSinceTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('makeTransferToAdminPrimaryAccountPure', () => {
    let toAdminPrimaryAccountTimestamp, tx
    const transferAmount = '5.43'
    const message = 'test-to adminPrimary account'
    let adminPrimarySummaryBefore
    let adminPrimarySummaryAfter
    let userSummaryBefore
    let userSummaryAfter

    before (async () => {
      toAdminPrimaryAccountTimestamp = new Date() / 1000
      adminPrimarySummaryBefore = await getAccountDetailsPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl)
      userSummaryBefore = await getAccountDetailsPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl)

      await sleep(500) // You need to sleep for a bit here because cyclos is slow...
      tx = await makeTransferToAdminPrimaryAccountPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl, transferAmount, message)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("should get the transfer that was created by timestamp and it should have the correct details", async () => {
      expect(true).to.be.equal(true)
      const adminPrimaryToTransfersSinceTimestamp = await getTransfersToPrimaryAccountPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl, toAdminPrimaryAccountTimestamp)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers.length).to.be.equal(1)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers[0].id).to.be.equal(tx.transferId)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers[0].amount).to.be.equal(transferAmount)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers[0].description).to.be.equal(message)
    })
    it("should reflect the correct amonut in the adminPrimary Account summary after transfers", async () => {
      adminPrimarySummaryAfter = await getAccountDetailsPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl)

      expect(
        adminPrimarySummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(adminPrimarySummaryBefore.status.balance) + parseFloat(transferAmount)).toFixed(2)
      )
    })
    it("should reflect the correct amonut in the user account summary after transfers", async () => {
      userAccountSummaryAfter = await getAccountDetailsPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl)

      expect(
        userAccountSummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(userSummaryBefore.status.balance) - parseFloat(transferAmount)).toFixed(2)
      )
    })
    it("should return the same `primaryAccountId` as the `getPrimaryAccountId` function", async () => {
      userAccountSummary = await getAccountDetailsPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl)
      const primaryAccountId = await getPrimaryAccountIdPure(user1ProxySessionToken, config.cbsProxyUrl)

      expect(
        userAccountSummary.id
      ).to.be.equal(
        primaryAccountId
      )
    })
  })

  describe('makeTransferFromAdminPrimaryAccountPure', () => {
    let fromAdminPrimaryAccountTimestamp, tx
    const transferAmount = '3.11'
    const message = 'test-from adminPrimary account'
    let adminPrimarySummaryBefore
    let adminPrimarySummaryAfter
    let userSummaryBefore
    let userSummaryAfter

    before (async () => {
      fromAdminPrimaryAccountTimestamp = new Date() / 1000
      adminPrimarySummaryBefore = await getAccountDetailsPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl)
      userSummaryBefore = await getAccountDetailsPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl)
      tx = await makeTransferFromAdminPrimaryAccountPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl, transferAmount, message, config.cbsAccountUser1)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("should get the transfer that was created by timestamp and it should have the correct details", async () => {
      const adminPrimaryFromTransfersSinceTimestamp = await getTransfersFromPrimaryAccountPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl, fromAdminPrimaryAccountTimestamp)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers.length).to.be.equal(1)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers[0].id).to.be.equal(tx.transferId)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers[0].amount).to.be.equal('-' + transferAmount)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers[0].description).to.be.equal(message)
    })
    it("should reflect the correct amonut in the adminPrimary Account summary after transfers", async () => {
      adminPrimarySummaryAfter = await getAccountDetailsPure(adminProxySessionToken, adminPrimaryAccountId, config.cbsProxyUrl)

      expect(
        adminPrimarySummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(adminPrimarySummaryBefore.status.balance) - parseFloat(transferAmount)).toFixed(2)
      )
    })
    it("should reflect the correct amonut in the user account summary after transfers", async () => {
      userAccountSummaryAfter = await getAccountDetailsPure(user1ProxySessionToken, user1PrimaryAccountId, config.cbsProxyUrl)

      expect(
        userAccountSummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(userSummaryBefore.status.balance) + parseFloat(transferAmount)).toFixed(2)
      )
    })
  })
})
