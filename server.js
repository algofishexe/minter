// Mint NFTs automagically
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { NFTStorage, Blob } from 'nft.storage';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config()

const ALGO_SERVER = "https://testnet-algorand.api.purestake.io/ps2"; // TESTNET
// const ALGO_SERVER = "https://mainnet-algorand.api.purestake.io/ps2"; // MAINNET

// folder holding images for minting
const IMAGE_DIR_PATH = "./images";

// ARC-69 METADATA
const PROPERTIES_FILE = "properties.csv";
const UNIT_PREFIX = "BUB-"; // Prefix before identifying number in unit name. eg. "BUB-1", "BUB-2",...
const ASSET_PREFIX = "Algobubble #"; // Prefix before identifying number in asset name
const DESCRIPTION = "generative bubbles";
const MIME_TYPE = "image/png"; // if .jpg, use image/jpg etc.
const EXTERNAL_URL = ""; // external URL, NOT the image URL (could be project URL, etc)
const PROPERTIES = await loadAllProperties();

async function upload(filename) {
  const endpoint = 'https://api.nft.storage' // the default
  const token = process.env.NFTSTORAGE_KEY // your API key from https://nft.storage/manage
  const storage = new NFTStorage({ endpoint, token })
  const data = await fs.promises.readFile(filename)

  const cid = await storage.storeBlob(new Blob([data]))
  return `ipfs://${cid}`;
}

async function waitForConfirmation(algodclient, txId) {
    let response = await algodclient.status().do();
    let lastround = response["last-round"];
    while (true) {
        const pendingInfo = await algodclient.pendingTransactionInformation(txId).do();
        if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
            //Got the completed Transaction
            console.log("Transaction " + txId + " confirmed in round " + pendingInfo["confirmed-round"]);
            break;
        }
        lastround++;
        await algodclient.statusAfterBlock(lastround).do();
    }
};

async function loadAllProperties() {
  let properties = {}
  return new Promise((resolve, reject) =>
    fs.createReadStream(PROPERTIES_FILE)
      .pipe(csv())
      .on('data', (row) => {
        let filename = `${IMAGE_DIR_PATH}/${row.filename}`;
        properties[filename] = {}
        for (var key of Object.keys(row)) {
          if (key == "filename") {
            continue;
          }
          if (row[key] === "") {
            continue;
          }
          properties[filename][key] = row[key]
        }
      })
      .on('error', e => {
            reject(e);
      })
      .on('end', () => {
        resolve(properties);
      })
  );
}

function getARC69(filename) {
  let normal = {
    "standard": "arc69",
    "description": DESCRIPTION,
    "mime_type": MIME_TYPE,
    "properties": PROPERTIES[filename]
  }
  return normal
}

async function updateNFTNote(assetID) {
  const server = ALGO_SERVER;
  const port = '';
  const token = {
      'X-API-Key': process.env.PURESTAKE_KEY
  }

  let algodclient = new algosdk.Algodv2(token, server, port);
  var account = algosdk.mnemonicToSecretKey(process.env.MNEMONIC);
  let address = account.addr;

  var enc = new TextEncoder();
  let note = enc.encode(JSON.stringify(getARC69(assetID)));
  let params = await algodclient.getTransactionParams().do();
  let manager = address;
  let reserve = address;
  let freeze = undefined;
  let clawback = undefined;

  let ctxn = algosdk.makeAssetConfigTxnWithSuggestedParams(address, note, assetID, manager, reserve, freeze, clawback, params, false);
  let rawSignedTxn = ctxn.signTxn(account.sk)
  let ctx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
  await waitForConfirmation(algodclient, ctx.txId);
  console.log(`Transaction ${ctx.txID} confirmed.`);
}

async function mintNFT(count,filename) {
    const server = ALGO_SERVER;
    const port = '';
    const token = {
        'X-API-Key': '41pjge3LxE2xttmxMjNgw9DjUzJNcyduaUZ0JX7y'
    }

    let algodclient = new algosdk.Algodv2(token, server, port);
    var account_mnemonic = process.env.MNEMONIC;
    var account = algosdk.mnemonicToSecretKey(account_mnemonic);
    let accountInfo = await algodclient.accountInformation(account.addr).do();
    console.log("Account balance: %d microAlgos", accountInfo.amount);

    let address = account.addr;
    let params = await algodclient.getTransactionParams().do();
    var enc = new TextEncoder();
    let note = enc.encode(JSON.stringify(getARC69(filename)));
    let addr = address;
    let defaultFrozen = false;
    let decimals = 0;
    let totalIssuance = 1;
    let unitName = `${UNIT_PREFIX}${count}`;
    let assetName = `${ASSET_PREFIX}${count}`;
    let assetURL = await upload(filename);
    let assetMetadataHash = undefined;
    let manager = address;
    let reserve = address;
    let freeze = undefined;
    let clawback = undefined;

    let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(addr, note, totalIssuance, decimals, defaultFrozen, manager, reserve, freeze, clawback, unitName, assetName, assetURL, assetMetadataHash, params);

    console.log(`Minting ${assetName} (${unitName}) from ${filename}...`)
    let rawSignedTxn = txn.signTxn(account.sk)
    let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
    let assetID = null;
    // wait for transaction to be confirmed
    await waitForConfirmation(algodclient, tx.txId);
    // Get the new asset's information from the creator account
    let ptx = await algodclient.pendingTransactionInformation(tx.txId).do();
    assetID = ptx["asset-index"];
    return assetID;
};

async function mintAll() {
  let directoryPath = path.join(path.resolve(), IMAGE_DIR_PATH);
  let fileNames = fs.readdirSync(directoryPath, function (err, files) {
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      }
      return files
  });

  for (var i = 0; i < fileNames.length; i++) {
    let fileName = fileNames[i];
    let assetID = await mintNFT(i+1, `${IMAGE_DIR_PATH}/${fileName}`);
    console.log(`Minted ASA ${assetID} from ${fileName}`);
  }
}

mintAll()
