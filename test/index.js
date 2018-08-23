const {
  expect,
  assert
} = require('chai')
const cbsProxyClient = require('../lib')
const {
  makeRandomTransfersToOmnibusAccount,
  makeRandomTransfersFromOmnibusAccount,
  getSessionToken,
  sleep
} = require('./helpers.js')
const config = require('./config')

describe("The core banking system proxy", function() {
  this.timeout(100*1000)

  let adminProxyClient
  let user1ProxyClient
  before (async () => {
    adminProxyClient = await cbsProxyClient(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
    user1ProxyClient = await cbsProxyClient(config.cbsUnameUser1, config.cbsPasswordUser1, config.cbsProxyUrl)
  })


  describe('getTransfersToOmnibusAccount', () => {
    let transfers

    before (async () => {
      const sessionToken = await getSessionToken(config.cbsUnameUser1, config.cbsPasswordUser1, config.cbsProxyUrl)
      transfers = await makeRandomTransfersToOmnibusAccount(11, sessionToken)
    })
    it("returns a list of TO transfers of the omnibus account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersToOmnibusAccount(transfers[i].timestamp)
        console.log(omnibusCreditsFromTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
    it("returns a list of FROM transfers of user account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const userDebitTrnsferFromTimestamp = await adminProxyClient.getTransfersToOmnibusAccount(transfers[i].timestamp)
        console.log(userDebitTrnsferFromTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(userDebitTrnsferFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('getTransfersFromOmnibusAccount', () => {
    let transfers
    let user

    before (async () => {
      const sessionToken = await getSessionToken(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
      transfers = await makeRandomTransfersFromOmnibusAccount(11, sessionToken)
    })
    it("returns a list of FROM transfers to the omnibus account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersFromOmnibusAccount(transfers[i].timestamp)
        console.log(omnibusCreditsFromTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })

  })

  describe('makeTransferToOmnibusAccount', () => {
    let toOmnibusTimestamp, tx
    const transferAmount = '5.43'
    const message = 'test-to omnibus account'
    let omnibusSummaryBefore
    let omnibusSummaryAfter
    let userSummaryBefore
    let userSummaryAfter

    before (async () => {
      toOmnibusTimestamp = new Date() / 1000
      omnibusSummaryBefore = await adminProxyClient.getAccountDetails()
      userSummaryBefore = await user1ProxyClient.getAccountDetails()

      await sleep(500) // You need to sleep for a bit here because cyclos is slow...
      tx = await user1ProxyClient.makeTransferToOmnibusAccount(transferAmount, message)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("should get the transfer that was created by timestamp and it should have the correct details", async () => {
      const omnibusToTransfersFromTimestamp = await adminProxyClient.getTransfersToOmnibusAccount(toOmnibusTimestamp)
      expect(omnibusToTransfersFromTimestamp.transfers.length).to.be.equal(1)
      expect(omnibusToTransfersFromTimestamp.transfers[0].id).to.be.equal(tx.transferId)
      expect(omnibusToTransfersFromTimestamp.transfers[0].amount).to.be.equal(transferAmount)
      expect(omnibusToTransfersFromTimestamp.transfers[0].description).to.be.equal(message)
    })
    it("should reflect the correct amonut in the omnibus Account summary after transfers", async () => {
      omnibusSummaryAfter = await adminProxyClient.getAccountDetails()

      expect(
        omnibusSummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(omnibusSummaryBefore.status.balance) + parseFloat(transferAmount)).toFixed(2)
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
  })
  describe('makeTransferFromOmnibusAccount', () => {
    let fromOmnibusTimestamp, tx
    const transferAmount = '3.11'
    const message = 'test-from omnibus account'
    let omnibusSummaryBefore
    let omnibusSummaryAfter
    let userSummaryBefore
    let userSummaryAfter

    before (async () => {
      fromOmnibusTimestamp = new Date() / 1000
      omnibusSummaryBefore = await adminProxyClient.getAccountDetails()
      userSummaryBefore = await user1ProxyClient.getAccountDetails()
      tx = await adminProxyClient.makeTransferFromOmnibusAccount(transferAmount, message, config.cbsAccountUser1)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("should get the transfer that was created by timestamp and it should have the correct details", async () => {
      const omnibusFromTransfersFromTimestamp = await adminProxyClient.getTransfersFromOmnibusAccount(fromOmnibusTimestamp)
      expect(omnibusFromTransfersFromTimestamp.transfers.length).to.be.equal(1)
      expect(omnibusFromTransfersFromTimestamp.transfers[0].id).to.be.equal(tx.transferId)
      expect(omnibusFromTransfersFromTimestamp.transfers[0].amount).to.be.equal('-' + transferAmount)
      expect(omnibusFromTransfersFromTimestamp.transfers[0].description).to.be.equal(message)
    })
    it("should reflect the correct amonut in the omnibus Account summary after transfers", async () => {
      omnibusSummaryAfter = await adminProxyClient.getAccountDetails()

      expect(
        omnibusSummaryAfter.status.balance
      ).to.be.equal(
        // NOTE:: Beware of the rounding error!
        (parseFloat(omnibusSummaryBefore.status.balance) - parseFloat(transferAmount)).toFixed(2)
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
