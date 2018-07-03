const {
  expect,
  assert
} = require('chai')
const cbsProxyClient = require('../lib')
const {
  makeRandomTransfersToOmnibusAccount,
  getSessionToken,
  sleep
} = require('./helpers.js')
const config = require('./config')

describe("The core banking system proxy", function() {
  this.timeout(100*1000)

  let proxyClient
  before (async () => {
    proxyClient = await cbsProxyClient('admin', 'abcd', config.cbsProxyUrl)
  })

  describe('getOmnibusCredits', () => {
    let transfers

    before (async () => {
      const sessionToken = await getSessionToken('user1', 'abcd', config.cbsProxyUrl)
      transfers = await makeRandomTransfersToOmnibusAccount(11, sessionToken)
      sleep(1500) // You need to sleep for a bit here because cyclos is slow...
    })
    it("returns a list of (credit) transfers to the omnibus account after a certain date", async () => {
      for (let i = 0; i < transfers.length; ++i) {
        const omnibusCreditsFromTimestamp = await proxyClient.getOmnibusCredits(transfers[i].timestamp)
        expect(omnibusCreditsFromTimestamp.transfers.length).to.be.equal(transfers.length - i)
      }
    })
  })
})
