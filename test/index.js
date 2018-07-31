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
    user1ProxyClient = await cbsProxyClient(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
  })


  describe('getTransfersToOmnibusAccount', () => {
    let transfers

    before (async () => {
      const sessionToken = await getSessionToken(config.cbsUnameUser1, config.cbsPasswordUser1, config.cbsProxyUrl)
      transfers = await makeRandomTransfersToOmnibusAccount(11, sessionToken)
      sleep(5000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("returns a list of (credit) transfers to the omnibus account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersToOmnibusAccount(transfers[i].timestamp)
        console.log(omnibusCreditsFromTimestamp.transfers.length)
        expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })

  describe('getTransfersFromOmnibusAccount', () => {
    let transfers

    before (async () => {
      const sessionToken = await getSessionToken(config.cbsUnameAdmin, config.cbsPasswordAdmin, config.cbsProxyUrl)
      transfers = await makeRandomTransfersFromOmnibusAccount(11, sessionToken)
      sleep(5000) // You need to sleep for a bit here because cyclos is slow...
    })
    it("returns a list of (credit) transfers to the omnibus account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const omnibusCreditsFromTimestamp = await adminProxyClient.getTransfersFromOmnibusAccount(transfers[i].timestamp)
        console.log(omnibusCreditsFromTimestamp.transfers.length)
        expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })
})
