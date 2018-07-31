# cbs-proxy-client

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
const cbsProxyClient = require('cbs-proxy-client')

// this object handles authentication and manages session tokens for you.
const proxyClient = await cbsProxyClient('admin', 'abcd', 'http://localhost:4000')

// get all transfers after a certain timestamp
const omnibusToTransfersSinceTimestamp = await proxyClient.getTransfersToOmnibusAccount(1533077567.294)
const omnibusFromTransfersSinceTimestamp = await proxyClient.getTransfersFromOmnibusAccount(1533077567.294)
```
