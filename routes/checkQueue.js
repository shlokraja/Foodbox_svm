var express = require('express');
var router = express.Router();
var debug = require('debug')('outlet_app:server');
var format = require('string-format');
var firebase = require('firebase');
var redis = require('redis');
var lockredis = require('lockredis');
var path = require('path');
var async = require('async');
var fs = require('fs');
var request = require('request');
var requestretry = require('requestretry');
var randomstring = require('randomstring');
var cronJob = require('cron').CronJob;

var helper = require('./helper');
//var _ = require('underscore');
format.extend(String.prototype);

//Initiating the redisClient
var redisClient = redis.createClient({ connect_timeout: 2000, retry_max_delay: 5000 });

//checks for connection
redisClient.on('error', function (msg) {
    console.error(msg);
});

redisClient.on('connect', function () {
    console.log('connected');
});


module.exports.checkSvmOrdeQueue = function () {
    console.log("checkSvmOrdeQueue");
    var DispenseDetails = [];

    redisClient.get("svm_dispenser_id", function (err, reply) {
        if (reply) {
            var dispenser_id = parseInt(reply);
            dispenser_id = dispenser_id + 1;
            var itemCount = 0;

            redisClient.lrange(helper.svm_order_queue, 0, -1,
                function (err, arr) {
                    if (err) {
                        console.log("errrorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
                        console.error(err);
                        //res.status(500).send(err);
                        return;
                    }
                    if (arr.length > 0) {
                        for (var i = 0; i < arr.length; i++) { 
                            var item = JSON.parse(arr[i]);

                            if (item.IsUpdatedInDispenser == false) {
                                console.log("item");
                                console.log(item);
                                item.IsUpdatedInDispenser = true;
                                for (var j = 0; j < item.quantity; j++) {
                                    console.log("dispenseer id reply");
                                    item.status =  helper.status_dispensing;
                                    var dispQueue = { "bill_no": item.bill_no, "item_id": item.item_id, "quantity": 1, "status": item.status, "dispenser_id": dispenser_id, "subitem_id": item.subitem_id };
                                    redisClient.lpush(helper.svm_dispenser_queue, JSON.stringify(dispQueue));
                                    console.log("Inserting into Dispenser Queue **************bill:" + item.bill_no + "item_id:" + item.item_id + "quantity:" + "1");
                                    dispenser_id = dispenser_id + 1;
                                    itemCount = itemCount + 1;
                                    redisClient.lset(helper.svm_order_queue, i, JSON.stringify(item));
                                }
                            }
                        }
                    }

                    redisClient.incrby(helper.svm_dispenser_id, itemCount, function (err, reply) {
                        if (reply) {
                            //console.log(reply);
                        }

                    });
                });
        }
        updateCvmOrdeQueue();
    });
    return;

}
function updateCvmOrdeQueue() {
    console.log("updateCvmOrdeQueue");


    var DispenseDetails = [];
    var orderDetails = [];
    redisClient.lrange(helper.svm_dispenser_queue, 0, -1,
        function (err, dispQueue) {
            if (err) {
                console.error(err);
                //res.status(500).send(err);
                return;
            }
            if (dispQueue.length > 0) {
                for (var i = 0; i < dispQueue.length; i++) {
                    DispenseDetails.push(JSON.parse(dispQueue[i]));
                }

            }
            else {
                return;
            }

            redisClient.lrange(helper.svm_order_queue, 0, -1,
                function (err, orderQueue) {
                    if (err) {
                        console.error(err);
                        //res.status(500).send(err);
                        return;
                    }
                    if (orderQueue.length > 0) {
                        for (var i = 0; i < orderQueue.length; i++) {
                            orderDetails.push(JSON.parse(orderQueue[i]));
                        }

                    }
                    else {
                        return;
                    }
                    // console.log("update delivered in order queue");

                    orderDetails.forEach(function (item, i) {

                        var itemCount = 0;
                        if (item.status != helper.status_delivered) {
                            //       console.log("item_id:" + item.item_id + " bill no:" + item.bill_no + " quantity:" + item.quantity);
                            DispenseDetails.forEach(function (ditem, i) {
                                if (ditem.item_id == item.item_id && ditem.bill_no == item.bill_no && ditem.status == 'delivered') {
                                    itemCount += 1;
                                }
                            });
                            if (itemCount == item.quantity) {
                                item.status = helper.status_delivered;
                                redisClient.LSET(helper.svm_order_queue, i, JSON.stringify(item));
                                  console.log("*********************Delivered******************");
                            }
                            else {
                                   console.log("*********************Not Delivered******************");
                            }
                        }

                    });





                });

        });


    return;
}

