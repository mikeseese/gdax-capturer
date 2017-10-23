"use strict";

const Gdax = require("../gdax-node");
const orderbookSync = new Gdax.OrderbookSync(['BTC-USD', 'ETH-USD']);
orderbookSync.on("message", (data) => {
    const aggState = orderbookSync.books['BTC-USD'].aggregateState();
})
setInterval(() => {
    //
}, 1000);
