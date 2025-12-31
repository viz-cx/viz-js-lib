# viz.js
viz.js the JavaScript Library with API Support for VIZ blockchain

[![npm version](https://badge.fury.io/js/viz-js-lib.svg)](https://badge.fury.io/js/viz-js-lib)

# Install
```
$ npm install viz-js-lib --save
```

## Browser
Online library minify js available in [jsDelivr CND](https://cdn.jsdelivr.net/npm/viz-js-lib@latest/dist/viz.min.js) and [Unpkg CDN](https://unpkg.com/viz-js-lib@latest/dist/viz.min.js).
```html
<script src="./viz.min.js"></script>
<script>
viz.api.getAccounts(['ned', 'dan'], function(err, response){
    console.log(err, response);
});
</script>
```

## Server

## WebSockets and HTTP transport
Library support 2 transport types: ws, wss for websocket and http, https for pure HTTP JSONRPC.
Examples:
```js
viz.config.set('websocket','wss://node.viz.cx/');
viz.config.set('websocket','https://api.viz.world/');
```

## Examples
### Broadcast Vote
```js
import viz from 'viz-js-lib';//nodejs lib

const wif = viz.auth.toWif(username, password, 'regular');
viz.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
	console.log(err, result);
});
```

### Get Accounts
```js
viz.api.getAccounts(['ned', 'dan'], function(err, result) {
	console.log(err, result);
});
```

# Documentation
Here is full documentation:
https://github.com/VIZ-Blockchain/viz-js-lib/tree/master/doc

## Build
```
apt-get install -y webpack
apt-get install -y npm
apt-get install -y git

npm install -g n
n v8.4.0
PATH="$PATH"

git clone https://github.com/VIZ-Blockchain/viz-js-lib.git
cd viz-js-lib/

npm install
npm run build-browser
ls dist
```

## Contributions
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list.

## Issues
When you find issues, please report them!

## License
MIT
