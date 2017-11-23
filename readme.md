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


## Examples

| name | description |
|------|-------------|
|[lotion-chat](https://github.com/keppel/lotion-chat) | basic chat on lotion |
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