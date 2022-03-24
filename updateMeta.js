// Update arc69 Meta data Automatically

import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { NFTStorage, Blob } from 'nft.storage';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config()

const ALGO_SERVER = "https://testnet-algorand.api.purestake.io/ps2"; // TESTNET
// const ALGO_SERVER = "https://mainnet-algorand.api.purestake.io/ps2"; // MAINNET

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

async function bulkUptate() {
    updateFiles.forEach(file => {
        let fileName = file.files[0].name;
        let fileExtension = fileName.split('.').pop();
        if(fileExtension == "json"){
            // let filePath =  
            let rawdata = fs.readFileSync(path.resolve(__dirname, `/updateFiles/${fileName}`));
            let metaData = JSON.parse(rawdata);
console.log(student); 
        }
            
    });
}