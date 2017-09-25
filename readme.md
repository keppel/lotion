<h1 align="center">
  <br>
  <a href="https://github.com/keppel/lotion"><img src="https://user-images.githubusercontent.com/1269291/29349405-8913556c-820e-11e7-8515-bd0e7b2b0027.jpg" alt="Lotion" width="110"></a>
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

```js
let lotion = require('lotion')(opts)

let app = lotion((state, tx) => {
  state.count++
})
```

**Lotion** makes it super easy to write blockchain apps in JavaScript!

To write a Lotion app, you just need to write one function: the `state machine`. Your `state machine` will take two arguments: the current `state` of your app (just a js object), and a `transaction` (or `tx` for short -- just another js object). Your `state machine` is then responsible for mutating your `state` depending on the data in the `tx`.

Under the hood, the [Tendermint](https://tendermint.com) consensus engine will keep all connected clients in sync with each other as long as your function maps a `(state, transaction)` pair to a state mutation deterministically.

Lotion abstracts away as much of the complicated p2p and consensus logic as possible, exposing it via a simple REST API. This lets you focus on just designing the high-level blockchain logic for your app.

*Note:* the security of Lotion has not yet been evaluated. If you're securing any significant amount of value, please write your app with [Cosmos SDK](https://github.com/tendermint/basecoin) instead.


## Usage

```
npm install lotion
```

### Example: Counter
What's the simplest possible app we could make? Let's just count the number of transactions our app sees.

in `counter.js`:
```js
let lotion = require('lotion')({
  initialState: { count: 0 },
  port: 3000
})

lotion((state, tx) => {
  state.count++
})
```

ok cool, now run it:
```
node counter.js
```

now there's an API running on `http://localhost:3000` to interact with our app's state. let's query the current state from the blockchain with curl:

```
curl http://localhost:3000/state
# {"count":0}
```

now let's send a transaction with some nonsense data in it

```
curl http://localhost:3000/txs -d '{}'
```

now query the state again:

```
curl http://localhost:3000/state
# {"count":1}
```
woo!

### Other Examples

| name | description |
|------|-------------|
|[lotion-chat](https://github.com/keppel/lotion-chat) | basic chat on lotion |
|[lotion-coin](https://github.com/keppel/lotion-coin) | cryptocurrency on lotion | 






