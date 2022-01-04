# minter
mint algorand NFTs from node.js following [ARC-69](https://github.com/algokittens/arc69)

## Setup

You will need node (https://nodejs.org/en/). After cloning the repo, `npm install` should install all dependencies.

### Accounts

 - Make an https://nft.storage/ account and put the key in `.env` as the `NFTSTORAGE_KEY`.
 - Make a https://www.purestake.com/ account and put the key in `.env` as the `PURESTAKE_KEY`
 - Make a testnet account using your wallet of choice, [fund it](https://bank.testnet.algorand.network/)  and put the mnemonic in the `.env` as `MNEMONIC`. NOTE: you can also use a real account on mainnet by changing `ALGO_SERVER` in `server.js`.

### Variables

In `server.js`, change the following variables for your project:

```js
const UNIT_PREFIX = "BUB-"; // Prefix before identifying number in unit name. eg. "BUB-1", "BUB-2",...
const ASSET_PREFIX = "Algobubble #"; // Prefix before identifying number in asset name
const DESCRIPTION = "generative bubbles";
const MIME_TYPE = "image/png"; // if .jpg, use image/jpg etc.
const EXTERNAL_URL = ""; // external URL, NOT the image URL (could be project URL, etc)
```

### Images

Put your images to be minted in the `/images` directory.

### Properties

Edit `properties.csv` to contain the appropriate data for your project. Each row *must* contain `filename`, but you can leave columns empty and they won't be populated. eg.
|filename         |a    |b    |c    |d    |e    |
|-----------------|-----|-----|-----|-----|-----|
|1641042139996.png|testA|testB|testC|testD|testE|
|1641042143236.png|testF|testG|testH|testI|testJ|
|1641042146100    |testK|testL|     |testN|testO|

## Running

To run, simply execute `node server.js`. If all goes well, you should see some messages being logged relating to your transactions.
