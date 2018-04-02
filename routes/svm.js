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

router.get('/', function (req, res) {
    res.send('send_item_details');
});

router.get('/get_item_details', function (req, res, next) {
    //cron.schedule('*/5 * * * * *', function () {
    console.log('***********************running a task every five seconds');
    //get the item details from redis queue     

    redisClient.lrange(helper.svm_order_queue, 0, -1,
        function (err, reply) {
            if (err) {
                console.error(err);
                res.status(500).send(err);
                return;
            }
            var arr = new Array();
            if (reply.length > 0) {
                for (var i = 0; i < reply.length; i++) {
                    arr.push(JSON.parse(reply[i]));
                }
            }
            //console.log("***get_item_details***" + reply);
            //get the item details
            res.send(arr);
        });
    /* });*/
});

//send the item details to redis
router.post('/send_item_details', function (req, res) {
    console.log('send item details');
    var obj = req.body;
    obj.outlet_id = process.env.OUTLET_ID;
    obj.IsUpdatedInDispenser = false;
    var item_details = [];
    console.log("Incoming Queue");
    console.log(JSON.stringify(obj));

    var locker = lockredis(redisClient);
    locker('lock_item', {
        timeout: 5000,
        retries: Infinity,
        retryDelay: 10
    }, function (lock_err, done) {
        if (lock_err) {
            // Lock could not be acquired for some reason.
            general.genericError("mobileapp.js :: GetRequiredItems: " + lock_err);
            return res.status(500).send({ bill_no: -1 });
        }
        redisClient.lpush(helper.svm_order_queue, JSON.stringify(obj));
   console.log("***********data pushed*******************");
        
    });
  res.send("success");
});

router.post('/update_item_details', function (req, res) {
    console.log('update item details');
    console.log(req.body);
    var json = req.body;
    
    console.log("json");
	var dispDetailSet = [];
	redisClient.lrange(helper.svm_dispenser_queue, 0, -1,
		function (err, dispQueue) {
		if (err) {
			console.error(err);
			res.status(500).send(err);
			return;
		}
		if (dispQueue.length > 0) {
			for (var j = 0; j < dispQueue.length; j++) {
				dispDetailSet.push(JSON.parse(dispQueue[j]));				
			}
			for (var k = 0; k < dispDetailSet.length; k++) {
				if(dispDetailSet[k].status == 'delivered')
				{
				redisClient.lset(helper.svm_dispenser_queue, k, JSON.stringify(dispDetailSet[k]), function (err, reply) {
						if (err) {
							console.log("Error while setting the queue " + JSON.stringify(dispDetailSet[k]));
							return;
						}
					});
				}
			}
			
		}
	});
	
	for (var i = 0; i < json.length; i++) {
		console.log(" updating item in for loop....." + JSON.stringify(json[i]));
		var item = json[i];
		/*}
    json.forEach(function (item, i) {*/
        console.log(item);
        var orderDetails = [];
        redisClient.lrange(helper.svm_order_queue, 0, -1,
            function (err, orderQue) {
                if (err) {
                    console.error(err);
                    res.status(500).send(err);
                    return;
                }
                if (orderQue.length > 0) {
                    for (var j = 0; j < orderQue.length; j++) {
                        orderDetails.push(JSON.parse(orderQue[j]));
                    }

                }
                for (var k = 0; k < orderDetails.length; k++) {
                    if (orderDetails[k].item_id == item.item_id && orderDetails[k].bill_no == item.bill_no && orderDetails[k].status == 'delivered') {
                        redisClient.lrem(helper.svm_order_queue, 1, JSON.stringify(orderDetails[k]), function (err, reply) {
                            if (err) {
                                console.log("Error while deleting the order queue");
                                return;
                            }
                            console.log("Deleted delivered item from order queue");
                        });
                        
                        //item_details.splice(i, 1);
                        break;
                    }
                }

            });
            console.log(item);
            var dispsenserDetails = [];
            redisClient.lrange(helper.svm_dispenser_queue, 0, -1,
                function (err, dispQueue) {
                    if (err) {
                        console.error(err);
                        res.status(500).send(err);
                        return;
                    }
                    if (dispQueue.length > 0) {
                        for (var j = 0; j < dispQueue.length; j++) {
                            dispsenserDetails.push(JSON.parse(dispQueue[j]));
                        }
    
                    }
                    for (var k = 0; k < dispsenserDetails.length; k++) {
                        if (dispsenserDetails[k].item_id == item.item_id && dispsenserDetails[k].bill_no == item.bill_no && dispsenserDetails[k].status == 'delivered') {
                            redisClient.lrem(helper.svm_dispenser_queue, 0, JSON.stringify(dispsenserDetails[k]), function (err, reply) {
                                if (err) {
                                    console.log("Error while deleting the order queue");
                                    return;
                                }
                                console.log("Deleted delivered item from order queue");
                            });
                            
                            //break;
                        }
                    }
                    
                });

    }
});


module.exports = router;