<h1 align="center">
  <br>
  <a href="https://github.com/keppel/lotion"><img src="https://user-images.githubusercontent.com/1269291/33154609-741d0d46-cfb7-11e7-9381-ac82418e8fdc.jpg" alt="Lotion" width="200"></a>
  <br>
      Lotion
  <br>
  <br>
</h1>

<h4 align="center">Smooth, easy blockchain apps. Powered by Tendermint consensus.</h4>

<p align="center">
  <a href="https://travis-ci.org/keppel/lotion">
    <img src="https://img.shields.io/travis/keppel/lotion/master.svg"
         alt="Travis Build">
  </a>
  <a href="https://www.npmjs.com/package/lotion">
    <img src="https://img.shields.io/npm/dm/lotion.svg"
         alt="NPM Downloads">
  </a>
  <a href="https://www.npmjs.com/package/lotion">
    <img src="https://img.shields.io/npm/v/lotion.svg"
         alt="NPM Version">
  </a>
</p>
<br>

Lotion is a new way to create blockchain apps in JavaScript, which aims to make writing new blockchains fast and fun. It builds on top of [Tendermint](https://tendermint.com) using the [ABCI](https://github.com/tendermint/abci) protocol. Lotion lets you write secure, scalable applications that can easily interoperate with other blockchains on the [Cosmos Network](https://cosmos.network/) using [IBC](https://github.com/cosmos/ibc).

Lotion itself is a tiny framework; its true power comes from the network of small, focused modules built upon it. Adding a fully-featured cryptocurrency to your blockchain, for example, takes only a [few lines of code.](https://github.com/mappum/coins)

Note: the security of this code has not yet been evaluated. If you expect your app to secure real value, please use [Cosmos SDK](https://github.com/cosmos/cosmos-sdk) instead.

## Installation

Lotion requires __node v7.6.0__ or higher.

```
$ npm install lotion
```

## Usage
`app.js`:
```js
let lotion = require('lotion')

let app = lotion({
  initialState: {
    count: 0
  }
})

app.use(function (state, tx) {
  if(state.count === tx.nonce) {
    state.count++
  }
})

app.listen(3000)
```

run `node app.js`, then:
```bash
$ curl http://localhost:3000/state
# { "count": 0 }

$ curl http://localhost:3000/txs -d '{ "nonce": 0 }'
# { "ok": true }

$ curl http://localhost:3000/state
# { "count": 1 }
```

## Introduction

Lotion lets you build blockchains. At any moment in time, the whole state of your blockchain is represented by a single JavaScript object called `state`.

Every user who runs your Lotion app will interact with the same blockchain. Anyone can submit a transaction, and it will automagically find its way to everyone else running the app. Everyone's `state` objects will constantly be kept in sync with each other.

A Lotion application is often a single function of signature `(state, tx)` which mutates your blockchain's `state` in response to a transaction `tx`. Both are just objects.

All of this cosmic witchcraft is made possible by a magic piece of software named [Tendermint](https://github.com/tendermint/tendermint) which exists specifically for synchronizing state machines across networks.

<p align="center">
  <a href="https://github.com/keppel/lotion"><img src="https://lotionjs.com/img/tm-blue.png" alt="Lotion" width="200"></a>
</p>
### Blockchains and Tendermint


The goal of a blockchain is to represent a single state being concurrently edited. In order to avoid conflicts between concurrent edits, it represents the state as a ledger: a series of transformations (transactions) applied to an initial state. The blockchain must allow all connected nodes to agree about which transformations are valid, and their ordering within the ledger.

To accomplish this, a blockchain is composed of three protocols: the __network__ protocol, __consensus__ protocol, and __transaction__ protocol.

The __network__ protocol is how nodes in the network tell each other about new transactions, blocks, and other nodes; usually a p2p gossip network.

The __consensus__ protocol is the set of rules that nodes should follow to determine which particular ordered set of transformations should be in the ledger at a given moment. In Bitcoin, the chain with the highest difficulty seen by a node is treated as authoritatively correct.

The __transaction__ protocol describes what makes transactions valid, and how they should mutate the blockchain's state.

**_When you're writing a Lotion app, you're only responsible for writing the transaction protocol._** Under the hood, Tendermint is handling the consensus and network protocols. When you start your lotion app, a Tendermint node is also started which will handle all of the communication with other nodes running your lotion app.

## Examples

| name | description |
|------|-------------|
|[lotion-chat](https://github.com/keppel/lotion-chat) | chat and collaborative haikus on lotion |
|[lotion-coin](https://github.com/keppel/lotion-coin) | cryptocurrency on lotion | 




## Contributors

Lotion is a cosmic journey for the mind brought to you by ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars2.githubusercontent.com/u/1269291?v=4" width="100px;"/><br /><sub><b>Judd</b></sub>](https://twitter.com/juddkeppel)<br />[💻](https://github.com/keppel/lotion/commits?author=keppel "Code") [📖](https://github.com/keppel/lotion/commits?author=keppel "Documentation") [🤔](#ideas-keppel "Ideas, Planning, & Feedback") [⚠️](https://github.com/keppel/lotion/commits?author=keppel "Tests") | [<img src="https://avatars2.githubusercontent.com/u/398285?v=4" width="100px;"/><br /><sub><b>Matt Bell</b></sub>](https://github.com/mappum)<br />[💻](https://github.com/keppel/lotion/commits?author=mappum "Code") [🤔](#ideas-mappum "Ideas, Planning, & Feedback") [⚠️](https://github.com/keppel/lotion/commits?author=mappum "Tests") [🔌](#plugin-mappum "Plugin/utility libraries") | [<img src="https://avatars1.githubusercontent.com/u/6021933?v=4" width="100px;"/><br /><sub><b>Jordan Bibla</b></sub>](http://www.jordanbibla.com)<br />[🎨](#design-jolesbi "Design") |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

Contributions of any kind welcome!

## License

MIT