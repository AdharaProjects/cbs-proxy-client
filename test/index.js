const {
  expect,
  assert
} = require('chai')
const { createCbsProxyObject } = require('../lib')
const {
  makeRandomTransfersToAdminPrimaryAccount,
  makeRandomTransfersFromAdminPrimaryAccount,
  getSessionToken,
  sleep
} = require('./helpers.js')
const config = require('./config')

describe("The core banking system proxy", function() {
  this.timeout(100*1000)

  let adminProxyClient
  let user1ProxyClient
  before (async () => {
    adminProxyClient = await createCbsProxyObject(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
    user1ProxyClient = await createCbsProxyObject(config.cbsUnameUser1, config.cbsPasswordUser1, config.cbsProxyUrl)
  })


  describe('getTransfersToPrimaryAccount', () => {
    let transfers

    before (async () => {
      const sessionToken = await getSessionToken(config.cbsUnameUser1, config.cbsPasswordUser1, config.cbsProxyUrl)
      transfers = await makeRandomTransfersToAdminPrimaryAccount(11, sessionToken)
    })
    it("returns a list of TO transfers of the adminPrimary account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const adminPrimaryCreditsSinceTimestamp = await adminProxyClient.getTransfersToPrimaryAccount(transfers[i].timestamp)
        console.log(adminPrimaryCreditsSinceTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(adminPrimaryCreditsSinceTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
    it("returns a list of FROM transfers of user account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const userDebitTrnsferSinceTimestamp = await adminProxyClient.getTransfersToPrimaryAccount(transfers[i].timestamp)
        console.log(userDebitTrnsferSinceTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(userDebitTrnsferSinceTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('getTransfersFromPrimaryAccount', () => {
    let transfers
    let user

    before (async () => {
      const sessionToken = await getSessionToken(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
      transfers = await makeRandomTransfersFromAdminPrimaryAccount(11, sessionToken)
    })
    it("returns a list of FROM transfers to the adminPrimary account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const adminPrimaryCreditsSinceTimestamp = await adminProxyClient.getTransfersFromPrimaryAccount(transfers[i].timestamp)
        console.log(adminPrimaryCreditsSinceTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(adminPrimaryCreditsSinceTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('makeTransferToAdminPrimaryAccount', () => {
    let toAdminPrimaryAccountTimestamp, tx
    const transferAmount = '5.43'
    const message = 'test-to adminPrimary account'
    let adminPrimarySummaryBefore
    let adminPrimarySummaryAfter
    let userSummaryBefore
    let userSummaryAfter

    before (async () => {
      toAdminPrimaryAccountTimestamp = new Date() / 1000
      adminPrimarySummaryBefore = await adminProxyClient.getAccountDetails()
      userSummaryBefore = await user1ProxyClient.getAccountDetails()

      await sleep(500) // You need to sleep for a bit here because cyclos is slow...
      tx = await user1ProxyClient.makeTransferToAdminPrimaryAccount(transferAmount, message)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("should get the transfer that was created by timestamp and it should have the correct details", async () => {
      const adminPrimaryToTransfersSinceTimestamp = await adminProxyClient.getTransfersToPrimaryAccount(toAdminPrimaryAccountTimestamp)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers.length).to.be.equal(1)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers[0].id).to.be.equal(tx.transferId)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers[0].amount).to.be.equal(transferAmount)
      expect(adminPrimaryToTransfersSinceTimestamp.transfers[0].description).to.be.equal(message)
    })
    it("should reflect the correct amonut in the adminPrimary Account summary after transfers", async () => {
      adminPrimarySummaryAfter = await adminProxyClient.getAccountDetails()

      expect(
        adminPrimarySummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(adminPrimarySummaryBefore.status.balance) + parseFloat(transferAmount)).toFixed(2)
      )
    })
    it("should reflect the correct amonut in the user account summary after transfers", async () => {
      userAccountSummaryAfter = await user1ProxyClient.getAccountDetails()

      expect(
        userAccountSummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(userSummaryBefore.status.balance) - parseFloat(transferAmount)).toFixed(2)
      )
    })
    it("should return the same `primaryAccountId` as the `getPrimaryAccountId` function", async () => {
      userAccountSummary = await user1ProxyClient.getAccountDetails()
      const primaryAccountId = user1ProxyClient.getPrimaryAccountId()

      expect(
        userAccountSummary.id
      ).to.be.equal(
        primaryAccountId
      )
    })
  })
  describe('makeTransferFromAdminPrimaryAccount', () => {
    let fromAdminPrimaryAccountTimestamp, tx
    const transferAmount = '3.11'
    const message = 'test-from adminPrimary account'
    let adminPrimarySummaryBefore
    let adminPrimarySummaryAfter
    let userSummaryBefore
    let userSummaryAfter

    before (async () => {
      fromAdminPrimaryAccountTimestamp = new Date() / 1000
      adminPrimarySummaryBefore = await adminProxyClient.getAccountDetails()
      userSummaryBefore = await user1ProxyClient.getAccountDetails()
      tx = await adminProxyClient.makeTransferFromAdminPrimaryAccount(transferAmount, message, config.cbsAccountUser1)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("should get the transfer that was created by timestamp and it should have the correct details", async () => {
      const adminPrimaryFromTransfersSinceTimestamp = await adminProxyClient.getTransfersFromPrimaryAccount(fromAdminPrimaryAccountTimestamp)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers.length).to.be.equal(1)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers[0].id).to.be.equal(tx.transferId)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers[0].amount).to.be.equal('-' + transferAmount)
      expect(adminPrimaryFromTransfersSinceTimestamp.transfers[0].description).to.be.equal(message)
    })
    it("should reflect the correct amonut in the adminPrimary Account summary after transfers", async () => {
      adminPrimarySummaryAfter = await adminProxyClient.getAccountDetails()

      expect(
        adminPrimarySummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(adminPrimarySummaryBefore.status.balance) - parseFloat(transferAmount)).toFixed(2)
      )
    })
    it("should reflect the correct amonut in the user account summary after transfers", async () => {
      userAccountSummaryAfter = await user1ProxyClient.getAccountDetails()

      expect(
        userAccountSummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(userSummaryBefore.status.balance) + parseFloat(transferAmount)).toFixed(2)
      )
    })
  })
})
