<h1 align="center">
  <br>
  <a href="https://github.com/keppel/lotion"><img src="https://user-images.githubusercontent.com/1269291/36411921-a4eadaf6-15cc-11e8-9614-b316de38d534.png" alt="Lotion" width="200"></a>
  <br>
      ✨ Lotion ✨
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
  <a href="https://slack.lotionjs.com">
    <img src="https://img.shields.io/badge/chat-on%20slack-7A5979.svg" alt="chat on slack">
  </a>
  <a href="https://codecov.io/gh/keppel/lotion">
    <img src="https://img.shields.io/codecov/c/github/keppel/lotion/develop.svg" alt="test coverage">
  </a>
  
</p>
<br>

Lotion is a new way to create blockchain apps in JavaScript, which aims to make writing new blockchains fast and fun. It builds on top of [Tendermint](https://tendermint.com) using the [ABCI](https://github.com/tendermint/abci) protocol. Lotion lets you write secure, scalable applications that can easily interoperate with other blockchains on the [Cosmos Network](https://cosmos.network/) using [IBC](https://github.com/cosmos/ibc).

Lotion itself is a tiny framework; its true power comes from the network of small, focused modules built upon it. Adding a fully-featured cryptocurrency to your blockchain, for example, takes only a [few lines of code.](https://github.com/mappum/coins)

Note: the security of this code has not yet been evaluated. If you expect your app to secure real value, please use [Cosmos SDK](https://github.com/cosmos/cosmos-sdk) instead.

## Installation

Lotion requires __node v7.6.0__ or higher, and a mac or linux machine.

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

Lotion lets you build blockchains. At any moment in time, the whole state of your blockchain is represented by a single JavaScript object called the `state`.

Users will create `transactions`: JavaScript objects that tell the application how to mutate the blockchain's `state`.

Every user who runs your Lotion app will interact with the same blockchain. Anyone can create a `transaction`, and it will automagically find its way to everyone else running the app and mutate their `state`. Everyone's `state` objects will constantly be kept in sync with each other.

A Lotion application is often a single function of signature `(state, tx)` which mutates your blockchain's `state` in response to a transaction `tx`. Both are just objects.

This cosmic wizardry is made possible by a magic piece of software named [Tendermint](https://github.com/tendermint/tendermint) which exists specifically for synchronizing state machines across networks.

<p align="center">
  <a href="https://github.com/keppel/lotion"><img src="https://lotionjs.com/img/tm-blue.png" alt="Lotion" width="200" /></a>
</p>

### Blockchains and Tendermint

The goal of a blockchain is to represent a single state being concurrently edited. In order to avoid conflicts between concurrent edits, it represents the state as a ledger: a series of transformations (transactions) applied to an initial state. The blockchain must allow all connected nodes to agree about which transformations are valid, and their ordering within the ledger.

To accomplish this, a blockchain is composed of three protocols: the __network__ protocol, __consensus__ protocol, and __transaction__ protocol.

The __network__ protocol is how nodes in the network tell each other about new transactions, blocks, and other nodes; usually a p2p gossip network.

The __consensus__ protocol is the set of rules that nodes should follow to determine which particular ordered set of transformations should be in the ledger at a given moment. In Bitcoin, the chain with the highest difficulty seen by a node is treated as authoritatively correct.

The __transaction__ protocol describes what makes transactions valid, and how they should mutate the blockchain's state.

**_When you're writing a Lotion app, you're only responsible for writing the transaction protocol._** Under the hood, Tendermint is handling the consensus and network protocols. When you start your lotion app, a Tendermint node is also started which will handle all of the communication with other nodes running your lotion app.

## Modules

| name | description |
|------|-------------|
|[lotion-chat](https://github.com/keppel/lotion-chat) | chat and collaborative haikus on lotion |
|[lotion-coin](https://github.com/keppel/lotion-coin) | early cryptocurrency prototype |
|[coins](https://github.com/mappum/coins) | fully-featured cryptocurrency middleware |
|[htlc](https://github.com/mappum/htlc) | hashed timelock contracts on coins |
|[testnet](https://github.com/keppel/testnet) | single-command testnet deployment |
|[shea](https://github.com/keppel/shea) | on-chain client code management |
|[merk](https://github.com/mappum/merk) | merkle AVL trees in javascript |




## Contributors

Lotion is a cosmic journey for the mind brought to you by:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars2.githubusercontent.com/u/1269291?v=4" width="100px;"/><br /><sub><b>Judd</b></sub>](https://twitter.com/juddkeppel)<br />[💻](https://github.com/keppel/lotion/commits?author=keppel "Code") [📖](https://github.com/keppel/lotion/commits?author=keppel "Documentation") [🤔](#ideas-keppel "Ideas, Planning, & Feedback") [⚠️](https://github.com/keppel/lotion/commits?author=keppel "Tests") | [<img src="https://avatars2.githubusercontent.com/u/398285?v=4" width="100px;"/><br /><sub><b>Matt Bell</b></sub>](https://github.com/mappum)<br />[💻](https://github.com/keppel/lotion/commits?author=mappum "Code") [🤔](#ideas-mappum "Ideas, Planning, & Feedback") [⚠️](https://github.com/keppel/lotion/commits?author=mappum "Tests") [🔌](#plugin-mappum "Plugin/utility libraries") | [<img src="https://avatars1.githubusercontent.com/u/6021933?v=4" width="100px;"/><br /><sub><b>Jordan Bibla</b></sub>](http://www.jordanbibla.com)<br />[🎨](#design-jolesbi "Design") | [<img src="https://avatars0.githubusercontent.com/u/18440102?v=4" width="100px;"/><br /><sub><b>Gautier Marin</b></sub>](https://github.com/gamarin2)<br />[📝](#blog-gamarin2 "Blogposts") | [<img src="https://avatars3.githubusercontent.com/u/1147244?v=4" width="100px;"/><br /><sub><b>Jackson Roberts</b></sub>](https://github.com/Jaxkr)<br />[💻](https://github.com/keppel/lotion/commits?author=Jaxkr "Code") | [<img src="https://avatars3.githubusercontent.com/u/758121?v=4" width="100px;"/><br /><sub><b>Mark Price</b></sub>](http://spentak.com)<br />[📖](https://github.com/keppel/lotion/commits?author=spentak "Documentation") [✅](#tutorial-spentak "Tutorials") [💡](#example-spentak "Examples") [📹](#video-spentak "Videos") | [<img src="https://avatars2.githubusercontent.com/u/14792822?v=4" width="100px;"/><br /><sub><b>Evan Leong</b></sub>](http://www.fountapp.com)<br />[🎨](#design-evanmayo "Design") |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [<img src="https://avatars0.githubusercontent.com/u/8525850?v=4" width="100px;"/><br /><sub><b>Chjango Unchained</b></sub>](https://cosmos.network)<br />[📝](#blog-Chjango "Blogposts") [📋](#eventOrganizing-Chjango "Event Organizing") | [<img src="https://avatars3.githubusercontent.com/u/18755233?v=4" width="100px;"/><br /><sub><b>SaifRehman</b></sub>](https://github.com/SaifRehman)<br />[💡](#example-SaifRehman "Examples") | [<img src="https://avatars3.githubusercontent.com/u/1772945?v=4" width="100px;"/><br /><sub><b>Lola Dam</b></sub>](https://github.com/rllola)<br />[🐛](https://github.com/keppel/lotion/issues?q=author%3Arllola "Bug reports") [💻](https://github.com/keppel/lotion/commits?author=rllola "Code") | [<img src="https://avatars1.githubusercontent.com/u/2449579?v=4" width="100px;"/><br /><sub><b>Djenad Razic</b></sub>](http://www.machinezdesign.com)<br />[💻](https://github.com/keppel/lotion/commits?author=MisterDr "Code") | [<img src="https://avatars3.githubusercontent.com/u/5900925?v=4" width="100px;"/><br /><sub><b>Admir Sabanovic</b></sub>](http://dev.ba)<br />[💻](https://github.com/keppel/lotion/commits?author=criticalbh "Code") | [<img src="https://avatars1.githubusercontent.com/u/5405348?v=4" width="100px;"/><br /><sub><b>Arne Meeuw</b></sub>](http://meeuw.me)<br />[💬](#question-ameeuw "Answering Questions") [🤔](#ideas-ameeuw "Ideas, Planning, & Feedback") | [<img src="https://avatars1.githubusercontent.com/u/36277340?v=4" width="100px;"/><br /><sub><b>Props.love</b></sub>](https://www.props.love)<br />[💻](https://github.com/keppel/lotion/commits?author=propslove "Code") |
| [<img src="https://avatars0.githubusercontent.com/u/172531?v=4" width="100px;"/><br /><sub><b>Peng Zhong</b></sub>](http://cosmos.network)<br />[🎨](#design-nylira "Design") [💡](#example-nylira "Examples") [🤔](#ideas-nylira "Ideas, Planning, & Feedback") |
<!-- ALL-CONTRIBUTORS-LIST:END -->

Contributions of any kind welcome!

## API

### `let app = require('lotion')(opts)`

Create a new Lotion app.

Here are the default options for `opts` which you can override:
```js
{
  devMode: false,       // set this true to wipe blockchain data between runs
  initialState: {},     // initial blockchain state
  keys: '',             // path to keys.json. generates own keys if not specified.
  genesis: '',          // path to genesis.json. generates new one if not specified.
  peers: [],            // array of '<host>:<p2pport>' of initial tendermint nodes to connect to. does automatic peer discovery if not specified. 
  logTendermint: false, // if true, shows all output from the underlying tendermint process          
  createEmptyBlocks: true, // if false, Tendermint will not create empty blocks which may result in a reduced blockchain file size        
  p2pPort: 46658,       // port to use for tendermint peer connections      
  tendermintPort: 46657 // port to use for tendermint rpc
}
```


### `app.use(function(state, tx, chainInfo) { ... })`

Register a transaction handler. Given a `state` and `tx` object, mutate `state` accordingly.

Transaction handlers will be called for every transaction, in the same order you passed them to `app.use()`.

Transaction handlers must be deterministic: for a given set of `state`/`tx`/`chainInfo` inputs, you **must** mutate `state` in the same way.

`chainInfo` is an object like:

```js
{
  height: 42, // number of blocks committed so far. usually 1 new block per second.
  validators: {
    '<some base64-encoded pubkey>' : 20, // voting power distribution for validators. requires understanding tendermint.
    '<other pubkey in base64>': 147 // it's ok if you're not sure what this means, this is usually hidden from you.
  }
}
```

If you'd like to change how much voting power a validator should have, simply mutate chainInfo.validators[pubKey] at any point!

### `app.useBlock(function(state, chainInfo) { ... })`

Add middleware to be called once per block, even if there haven't been any transactions. Should mutate `state`, see above to read more about `chainInfo`.

Most things that you'd use a block handler for can and should be done as `transactions`.

### `app.listen(port)`

Starts Lotion app, exposes http server on `port`.

## HTTP API

Lotion exposes a few endpoints for interacting with your blockchain. Lotion only listens for connections from localhost. The HTTP API is how you should connect to your Lotion blockchain to your UI -- the UI and Lotion app should run on the same machine.

### `GET /state`

This will return your app's most recent state as JSON.

```bash
$ curl http://localhost:3000/state
# {"count": 0}
```

### `POST /txs`

Create a new transaction and submit it to the network.

```bash
$ curl http://localhost:3000/txs -d '{}'
# {"state": {"count": 1},"ok": true}
```

### `GET /info`

Get some info about the node, such as its validator public key.

```bash
$ curl http://localhost:3000/info
# {"pubKey":"4D9471998DC5A60463B5CF219E4410521112CF578FFAD17C652AEC5D393297C2"}
```

### `GET,POST /tendermint/*`

Proxies to underlying tendermint node.

## Global Chain Identifiers and Light Clients

Lotion apps each have a unique global chain identifier (GCI). You can light client verify any running Lotion app from any computer in the world as long as you know its GCI.

```js
let { connect } = require('lotion')
let GCI = '6c94c1f9d653cf7e124b3ec57ded2589223a96416921199bbf3ef3ca610ffceb'

let { state, send } = await connect(GCI)

let count = await state.count
console.log(count) // 0

let result = await send({ nonce: 0 })
console.log(result) // { height: 42, ok: true }

count = await state.count
console.log(count) // 1
```

Under the hood, the GCI is used to discover and torrent the app's genesis.json.

It's also used as the rendezvous point with peers on the bittorrent dht and through multicast DNS to find a full node light client verify.

You can get the GCI of an app being run by a full node like this:
```js
let app = require('lotion')({ initialState: { count: 0 } })

let { GCI } = await app.listen(3000)
console.log(GCI) // '6c94c1f9d653cf7e124b3ec57ded2589223a96416921199bbf3ef3ca610ffceb'
```

## Links

- go read more at [https://lotionjs.com](https://lotionjs.com)!

## License

MIT
