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
    it("returns a list of TO transfers to the omnibus account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersToOmnibusAccount(transfers[i].timestamp)
        console.log(omnibusCreditsFromTimestamp.transfers.length, 'transfers occured since', Date(transfers[i].timestamp * 1000))
        expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('getTransfersFromOmnibusAccount', () => {
    let transfers

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
    let toOmnibusTimestamp

    before (async () => {
      toOmnibusTimestamp = new Date() / 1000
      user1ProxyClient.makeTransferToOmnibusAccount(5, 'test-to omnibus account')
      await sleep(100) // You need to sleep for a bit here because cyclos is slow...
    })
    it("returns a list of (credit) transfers to the omnibus account after a certain date", async () => {
      const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersToOmnibusAccount(toOmnibusTimestamp)
      expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(1)
    })
  })
  describe('makeTransferFromOmnibusAccount', () => {
    let fromOmnibusTimestamp

    before (async () => {
      fromOmnibusTimestamp = new Date() / 1000
      adminProxyClient.makeTransferFromOmnibusAccount(5, 'test-from omnibus account', config.cbsAccountUser1)
      await sleep(1000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("returns a list of (credit) transfers to the omnibus account after a certain date", async () => {
      const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersFromOmnibusAccount(fromOmnibusTimestamp)
      expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(1)
    })
  })
})
