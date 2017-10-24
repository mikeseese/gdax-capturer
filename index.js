"use strict";

const orderBook = "BTC-USD";
const numPricesPerType = 300;
const intervalPeriodMs = 100;
const destinationFolder = "/store/gdax/orderbooks/"

Date.prototype.yyyymmddhh = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    var hh = this.getHours();

    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd,
            (hh>9 ? '' : '0') + hh
            ].join('');
};

const hdf5 = require("hdf5").hdf5;
const h5lt = require("hdf5").h5lt;
const Access = require("hdf5/lib/globals").Access;

const Gdax = require("../gdax-node");

let data = [];
let numRows = 0;
let lastFileName = "";

const orderbookSync = new Gdax.OrderbookSync([orderBook]);

setInterval(() => {
    const timeStart = Date.now();
    const aggState = orderbookSync.books[orderBook].aggregateState(numPricesPerType);
    if(aggState.bidPrices.length > 0) {
        const currentDate = new Date();
        const timeMillis = currentDate.getTime();
        const fileName = destinationFolder + currentDate.yyyymmddhh() + "-" + orderBook + "-ORDER-BOOK.h5";
        let resetData = fileName !== lastFileName;
        lastFileName = fileName;

        let curData = Array(1 + numPricesPerType * 2 * 2);
        curData[0] = timeMillis;
        for(let i = 0; i < numPricesPerType; i++) {
            curData[1 + i*2] = aggState.bidPrices[i];
            curData[1 + i*2 + 1] = aggState.bidVolumes[i+1];
            curData[1 + numPricesPerType*2 + i*2] = aggState.askPrices[i];
            curData[1 + numPricesPerType*2 + i*2 + 1] = aggState.askVolumes[i+1];
        }

        if(resetData && data.length > 0) {
            let file = new hdf5.File(fileName, Access.ACC_TRUNC);

            let dataset = new Float64Array(data);
            dataset.rank = 2;
            dataset.rows = numRows;
            dataset.columns = 1 + numPricesPerType * 2 * 2;
            h5lt.makeDataset(file.id, "data", dataset);

            file.flush();
            file.close();
            data = [];
            numRows = 0;
        }

        data = data.concat(curData);
        numRows++;
    }
    const timeStop = Date.now();
    console.log(timeStop - timeStart + " ms");
}, intervalPeriodMs);
