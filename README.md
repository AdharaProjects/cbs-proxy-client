# cbs-proxy-client

Tests: [![CircleCI](https://circleci.com/gh/AdharaProjects/cbs-proxy-client.svg?style=svg&circle-token=3770174a4170d3dcd342c25cb3d1f1158466b584)](https://circleci.com/gh/AdharaProjects/cbs-proxy-client)

## Introduction

A simple javascript library to interact with the cbs-proxy.

## Getting started



### Testing

1. Run Cyclos.
2. Run the `cbs-proxy`
3. `npm test`

### Usage

`npm install cbs-proxy-client`


```javascript
const { createCbsProxyObject } = require('cbs-proxy-client')

// this object handles authentication and manages session tokens for you.
const proxyClient = await createCbsProxyObject('admin', 'abcd', 'http://localhost:4000')

// get all transfers after a certain timestamp
const primaryAccountToTransfersSinceTimestamp = await proxyClient.getTransfersToPrimaryAccount(1533077567.294)
const primaryAccountFromTransfersSinceTimestamp = await proxyClient.getTransfersFromPrimaryAccount(1533077567.294)
```

#### Pure versions of all the functions can also be used.

Pure functions are useful since you can use them anywhere in your code without needing to pass around a stateful object.

The below code effectively does the same thing as the previous example:

```javascript
const { getSessionToken, getPrimaryAccountId, getTransfersToPrimaryAccountPure, getTransfersFromPrimaryAccountPure } = require('cbs-proxy-client')

// get authentication token, and your primaryAccountId
const sessionToken = await getSessionToken('admin', 'abcd', 'http://localhost:4000')
const primaryAccountId = await getPrimaryAccountId(sessionToken, 'http://localhost:4000')

// get all transfers after a certain timestamp
const primaryAccountToTransfersSinceTimestamp = await getTransfersToPrimaryAccountPure(sessionToken, primaryAccountId, 'http://localhost:4000', 1533077567.294)
const primaryAccountFromTransfersSinceTimestamp = await getTransfersFromPrimaryAccountPure(sessionToken, primaryAccountId, 'http://localhost:4000', 1533077567.294)
```
