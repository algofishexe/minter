// Update arc69 Meta data Automatically

import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config()

//const ALGO_SERVER = "https://testnet-algorand.api.purestake.io/ps2"; // TESTNET
const ALGO_SERVER = "https://mainnet-algorand.api.purestake.io/ps2"; // MAINNET

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

//Function for bulk update of arc69 meta data
//The json file with meta data should have asset id as name. 
//The meta data should be updated in the prescribed format of example asset in arc69 folder
async function bulkUptate() {
    let filePath = './arc69/'
    //reading file names from the folder
    fs.readdir(filePath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //Extracting the assetID and metadata from each file
        files.forEach(file => {
            // Extracting assetID from the file name
            let assetID = Number(path.parse(file).name)
            console.log(typeof(assetID))
            //checking if the file with arc69 meta data is json or not
            let fileExtension = file.split('.').pop();
            if(fileExtension == "json"){
                
                let filePath = `./arc69/${file}`
                let dataBuffer = fs.readFileSync(filePath);
                let metaData = dataBuffer.toString();

                updateNFTNote(assetID, metaData)
            }             
        });
    })
}

async function updateNFTNote(assetID, metaData) {
    const server = ALGO_SERVER;
    const port = '';
    const token = {
        'X-API-Key': process.env.PURESTAKE_KEY
    }
  
    let algodclient = new algosdk.Algodv2(token, server, port);
    var account = algosdk.mnemonicToSecretKey(process.env.MNEMONIC);
    let address = account.addr;
  
    var enc = new TextEncoder();
    let note = enc.encode(metaData);
    let params = await algodclient.getTransactionParams().do();
    let manager = address;
    let reserve = address;
    let freeze = undefined;
    let clawback = undefined;
  
    let ctxn = algosdk.makeAssetConfigTxnWithSuggestedParams(address, note, assetID, manager, reserve, freeze, clawback, params, false);
    let rawSignedTxn = ctxn.signTxn(account.sk)
    let ctx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
    await waitForConfirmation(algodclient, ctx.txId);
    console.log(`Transaction ${ctx.txId} confirmed.`);
  }

bulkUptate()