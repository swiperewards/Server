var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));
var firebaseAdmin = require('firebase-admin');
var serviceAccount = require(path.resolve('.', 'nouvo-production-1541475714679-firebase-adminsdk-8b3p8-88dbb14487.json'));
var each = require('sync-each');

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://nouvo-android-app.firebaseio.com"
});


// exports.sendNotifToToken = function (req, res) {
//     var fcmToken = {
//         'token': req.body.requestData.token,
//         'userId': req.result.userId,
//         'notifBody': req.body.requestData.notifBody
//     }
//     // var token = "eJjFtWuQq3s:APA91bFad7dbkjiBcRQlcpZeIcTcyer5hgQLur_gePIB8by0N9TkKeoPXuU7EgmHChJXTZfoz3vYQhq-f8TFeikrLnRFqIgTi4XkGrIdJ_kcKih-LFIw3ZLRs7m-9Tddx7rG0I0vy5Cm";
//     var message = {
//         android: {
//             ttl: 3600 * 1000, // 1 hour in milliseconds
//             priority: 'normal',
//             notification: fcmToken.notifBody
//         },
//         token: fcmToken.token
//     };
//     sendNotifications(message, 0)
//         .then(() => {
//             logger.info("sendNotifToToken - " + req.result.userId);
//             res.send(responseGenerator.getResponse(200, "Notification sent successfully", null));
//         })
//         .catch((error) => {
//             logger.error("Firebase error", error);
//             res.send(responseGenerator.getResponse(1098, "Firebase error", error))
//         })
// }

// exports.sendNotifToTopic = function (req, res) {
//     var fcmToken = {
//         'topic': req.body.requestData.topic,
//         'userId': req.result.userId,
//         'notifBody': req.body.requestData.notifBody
//     }
//     // var token = "eJjFtWuQq3s:APA91bFad7dbkjiBcRQlcpZeIcTcyer5hgQLur_gePIB8by0N9TkKeoPXuU7EgmHChJXTZfoz3vYQhq-f8TFeikrLnRFqIgTi4XkGrIdJ_kcKih-LFIw3ZLRs7m-9Tddx7rG0I0vy5Cm";
//     var message = {
//         android: {
//             ttl: 3600 * 1000, // 1 hour in milliseconds
//             priority: 'normal',
//             notification: fcmToken.notifBody
//         },
//         topic: fcmToken.topic
//     };
//     sendNotifications(message, 0)
//         .then(() => {
//             logger.info("sendNotifToToken - " + req.result.userId);
//             res.send(responseGenerator.getResponse(200, "Notification sent successfully", null));
//         })
//         .catch((error) => {
//             logger.error("Firebase error", error);
//             res.send(responseGenerator.getResponse(1098, "Firebase error", error))
//         })
// }

exports.addUpdateFcmToken = function (req, res) {
    var fcmToken = {
        'token': req.body.requestData.token,
        'userId': req.result.userId
    }
    // parameters to be passed to AddFcmToken procedure
    var params = [fcmToken.token, fcmToken.userId]
    db.query("call AddFcmToken(?,?)", params, function (error, results) {
        if (!error) {
            logger.info("addUpdateFcmToken - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", {
                fcmTokenId: results[0][0].ip_NewID
            }))
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    })
}



exports.subscribeToTopic = function (req, res) {
    var fcmToken = {
        'tokens': req.body.requestData.tokens,
        'userId': req.result.userId,
        'topic': req.body.requestData.topic
    }
    var registrationTokens = fcmToken.tokens;

    firebaseAdmin.messaging().subscribeToTopic(registrationTokens, fcmToken.topic)
        .then((response) => {
            logger.info("subscribeToTopic - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Tokens subscribed successfully", null));
        })
        .catch((error) => {
            logger.error("Error subscribing to topic", error);
            res.send(responseGenerator.getResponse(1098, "Firebase error", error));
        });
}


exports.unsubscribeFromTopic = function (req, res) {
    var fcmToken = {
        'tokens': req.body.requestData.tokens,
        'userId': req.result.userId,
        'topic': req.body.requestData.topic
    }
    var registrationTokens = fcmToken.tokens;

    firebaseAdmin.messaging().unsubscribeFromTopic(registrationTokens, fcmToken.topic)
        .then((response) => {
            logger.info("unsubscribeFromTopic - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Tokens unsubscribed successfully", null));
        })
        .catch((error) => {
            logger.error("Error unsubscribing from topic", error);
            res.send(responseGenerator.getResponse(1098, "Firebase error", error));
        });
}



//Functions


exports.sendNotifToTokenFunction = function (token, notifBody, callback) {
    var fcmToken = {
        'token': token,
        'notifBody': notifBody
    }
    // var token = "eJjFtWuQq3s:APA91bFad7dbkjiBcRQlcpZeIcTcyer5hgQLur_gePIB8by0N9TkKeoPXuU7EgmHChJXTZfoz3vYQhq-f8TFeikrLnRFqIgTi4XkGrIdJ_kcKih-LFIw3ZLRs7m-9Tddx7rG0I0vy5Cm";
    var message = {
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: { "title": fcmToken.notifBody, "body": fcmToken.notifBody }
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: fcmToken.notifBody,
                        body: fcmToken.notifBody
                    },
                    sound: "default"
                }
            }
        },
        token: fcmToken.token
    };
    sendNotifications(message, 4)
        .then(() => {
            logger.info("sendNotifToToken - ");
            callback();
        })
        .catch((error) => {
            logger.error("Firebase error ", error);
            callback();
        })
}


exports.sendNotifPasswordChanged = function (userId, callback) {
    // select fcm_token into ip_referralToken from fcm_tokens where userId = ip_referralUserId;
    db.query('select fcm_token from fcm_tokens where userId = ?', [userId], function (error, results) {
        if (!error) {
            if (results.length > 0) {
                var fcmToken = {
                    'token': results[0].fcm_token,
                    'notifBody': "Your password has been changed"
                }

                sendNotifToTokenInternal(fcmToken.token, fcmToken.notifBody, function () {
                    callback();
                })
            }
            else {
                logger.info("sendNotifToToken - Password change - fcm token not available");
                callback();
            }

        }
        else {
            logger.error("Error while processing your request", error);
            callback();
        }
    });
}



exports.sendNotifRedeemReqStatusChanged = function (redeemReqId, newStatus, callback) {
    // select fcm_token into ip_referralToken from fcm_tokens where userId = ip_referralUserId;
    db.query('select userId from redeem_requests where id = ?', [redeemReqId], function (errorGetUserId, resultsGetUserId) {
        if (!errorGetUserId) {
            if (resultsGetUserId.length > 0) {
                db.query('select fcm_token from fcm_tokens where userId = ?', [resultsGetUserId[0].userId], function (error, results) {
                    if (!error) {
                        if (results.length > 0) {
                            var fcmToken = {
                                'token': results[0].fcm_token,
                                'notifBody': "Redeem request status changed to " + newStatus
                            }

                            sendNotifToTokenInternal(fcmToken.token, fcmToken.notifBody, function () {
                                callback();
                            })
                        }
                        else {
                            logger.info("sendNotifToToken - Password change - fcm token not available");
                            callback();
                        }

                    }
                    else {
                        logger.error("Error while processing your request", error);
                        callback();
                    }
                });
            }
            else {
                logger.info("sendNotifToToken - Redeem request status change - id not available");
                callback();
            }

        }
        else {
            logger.error("Error while processing your request", errorGetUserId);
            callback();
        }
    });
}




function sendNotifToTokenInternal(token, notifBody, callback) {
    var fcmToken = {
        'token': token,
        'notifBody': notifBody
    }
    // var token = "eJjFtWuQq3s:APA91bFad7dbkjiBcRQlcpZeIcTcyer5hgQLur_gePIB8by0N9TkKeoPXuU7EgmHChJXTZfoz3vYQhq-f8TFeikrLnRFqIgTi4XkGrIdJ_kcKih-LFIw3ZLRs7m-9Tddx7rG0I0vy5Cm";
    var message = {
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: { "title": fcmToken.notifBody, "body": fcmToken.notifBody }
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: fcmToken.notifBody,
                        body: fcmToken.notifBody
                    },
                    sound: "default"
                }
            }
        },
        token: fcmToken.token
    };
    sendNotifications(message, 0)
        .then(() => {
            logger.info("sendNotifToToken - ");
            callback();
        })
        .catch((error) => {
            logger.error("Firebase error ", error);
            callback();
        })
}



function sendNotifications(message, eventTypeId) {
    var msg = message.android.notification.body;
    var token = message.token;
    return new Promise((resolve, reject) => {
        console.info('Sending notification!')

        db.query('select userId from fcm_tokens where fcm_token = ?', [token], function (errorGetUserId, resultsGetUserId) {
            if (!errorGetUserId) {
                if (resultsGetUserId.length > 0) {
                    params = [eventTypeId, resultsGetUserId[0].userId, msg];
                    db.query("insert into event_notification(eventType, userId, notificationDetails) values (?, ?, ?)", params, function (error, results) {
                        if (!error) {

                            db.query("select * from users where userId = ?", [resultsGetUserId[0].userId], function (errorUserData, userData) {
                                if (!errorUserData) {
                                    if (userData[0].isNotificationEnabled) {
                                        logger.info("sendNotifications - notification recorded successfully for user - " + resultsGetUserId[0].userId);
                                        firebaseAdmin.messaging().send(message)
                                            .then((response) => {
                                                console.info('Notification message successfully sent:', response);
                                                resolve();
                                            })
                                            .catch((error) => {
                                                console.error('Error while sending notification: ', error);
                                                reject({ code: 500, message: "Error while sending notification", error: error });
                                                // return ({ code: 500, message: "Error while sending notification", error: error });
                                            });
                                    }
                                    else {
                                        resolve();
                                    }
                                } else {
                                    logger.error("sendNotifications - Error while processing your request", errorUserData);
                                    reject({ code: 500, message: "Error while sending notification", error: errorUserData });
                                }
                            })

                        } else {
                            logger.error("sendNotifications - Error while processing your request", error);
                        }
                    })
                }
                else {
                    logger.error("sendNotifications - user id not found for fcm token", null);
                    resolve();
                }
            }
            else {
                logger.error("sendNotifications - Error while processing your request", errorGetUserId);
                resolve();
            }
        });


    })
}



exports.sendNotifToUsers = function (reqData) {
    // arrUserNotifData = reqData.body;
    // select fcm_token into ip_referralToken from fcm_tokens where userId = ip_referralUserId;
    if (reqData.body.length > 0) {
        var userIds = "";
        for (var i = 0; i < reqData.body.length; i++) {
            if (i == 0)
                userIds = reqData.body[i].userId;
            else
                userIds = userIds + ", " + reqData.body[i].userId;
        }
        var transactionNotifArray = [];
        db.query('select f.userId, f.fcm_token, u.isNotificationEnabled from users u join fcm_tokens f on u.userId = f.userId where u.userId in (' + userIds + ')', function (errorGetFcmTokens, resultsGetFcmTokens) {
            if (!errorGetFcmTokens) {
                var objTxnNotif = {};
                var objXpIncreaseNotif = {};
                for (var j = 0; j < resultsGetFcmTokens.length; j++) {
                    for (var k = 0; k < reqData.body.length; k++) {
                        if (resultsGetFcmTokens[j].userId == reqData.body[k].userId) {
                            objTxnNotif.userId = resultsGetFcmTokens[j].userId;
                            objTxnNotif.message = reqData.body[k].msgTxnMade;
                            objTxnNotif.token = resultsGetFcmTokens[j].fcm_token;
                            objTxnNotif.isNotificationEnabled = resultsGetFcmTokens[j].isNotificationEnabled
                            objTxnNotif.eventTypeId = 3;
                            objTxnNotif.transactionAmount = reqData.body[k].total / 100;
                            transactionNotifArray.push(objTxnNotif);
                            objXpIncreaseNotif.userId = resultsGetFcmTokens[j].userId;
                            objXpIncreaseNotif.message = reqData.body[k].msgXpIncrease;
                            objXpIncreaseNotif.token = resultsGetFcmTokens[j].fcm_token;
                            objXpIncreaseNotif.token = resultsGetFcmTokens[j].fcm_token;
                            objXpIncreaseNotif.isNotificationEnabled = resultsGetFcmTokens[j].isNotificationEnabled
                            objXpIncreaseNotif.eventTypeId = 4;
                            objXpIncreaseNotif.transactionAmount = null;
                            transactionNotifArray.push(objXpIncreaseNotif);
                        }
                    }
                }

                var transactionNotifEnabled = [];
                for (var x = 0; x < transactionNotifArray.length; x++) {
                    if (transactionNotifArray[x].isNotificationEnabled) {
                        transactionNotifEnabled.push(transactionNotifArray[x]);
                    }
                }
                each(transactionNotifArray,
                    function (txn, next) {
                        params = [txn.eventTypeId, txn.userId, txn.message, txn.transactionAmount];
                        db.query("insert into event_notification(eventType, userId, notificationDetails, transactionAmount) values (?, ?, ?, ?)", params, function (error, results) {
                            next(error);
                        })
                    },
                    function (err) {
                        sendMultipleNotifToTokenInternal(transactionNotifEnabled);
                    })
            }
            else {
                logger.error("Error while processing your request", errorGetFcmTokens);
            }
        });
    }
}



exports.sendNotifLevelUp = function (reqData) {
    var levelData = reqData.body;
    db.query('select f.userId, f.fcm_token, u.isNotificationEnabled from users u join fcm_tokens f on u.userId = f.userId where u.userId = ?', [levelData.userId], function (errorGetFcmToken, resultGetFcmToken) {
        if (!errorGetFcmToken) {
            var msg = "Congratulations! You went up one level " + levelData.level;
            params = [2, levelData.userId, msg];
            db.query("insert into event_notification (eventType, userId, notificationDetails) values (?, ?, ?)", params, function (err, res) {
                if(resultGetFcmToken[0].isNotificationEnabled){
                    sendMultipleNotifications("Congratulations! You went up one level " + levelData.level, resultGetFcmToken[0].fcm_token, function(){
                    })
                }
            })
        }
        else {
            logger.error("Error while processing your request", errorGetFcmToken);
        }
    });

}



exports.sendNotifLevelUpAfterTxns = function (reqData) {
    // arrUserNotifData = reqData.body;
    // select fcm_token into ip_referralToken from fcm_tokens where userId = ip_referralUserId;
    if (reqData.body.length > 0) {
        var userIds = "";
        for (var i = 0; i < reqData.body.length; i++) {
            if (i == 0)
                userIds = reqData.body[i].userId;
            else
                userIds = userIds + ", " + reqData.body[i].userId;
        }
        var transactionNotifArray = [];
        db.query('select f.userId, f.fcm_token, u.isNotificationEnabled from users u join fcm_tokens f on u.userId = f.userId where u.userId in (' + userIds + ')', function (errorGetFcmTokens, resultsGetFcmTokens) {
            if (!errorGetFcmTokens) {
                var objLevelUpNotif = {};
                for (var j = 0; j < resultsGetFcmTokens.length; j++) {
                    for (var k = 0; k < reqData.body.length; k++) {
                        if (resultsGetFcmTokens[j].userId == reqData.body[k].userId) {
                            objLevelUpNotif.userId = resultsGetFcmTokens[j].userId;
                            objLevelUpNotif.message = reqData.body[k].message;
                            objLevelUpNotif.token = resultsGetFcmTokens[j].fcm_token;
                            objLevelUpNotif.isNotificationEnabled = resultsGetFcmTokens[j].isNotificationEnabled
                            objLevelUpNotif.eventTypeId = 2;
                            transactionNotifArray.push(objLevelUpNotif);
                        }
                    }
                }

                var transactionNotifEnabled = [];
                for (var x = 0; x < transactionNotifArray.length; x++) {
                    if (transactionNotifArray[x].isNotificationEnabled) {
                        transactionNotifEnabled.push(transactionNotifArray[x]);
                    }
                }
                each(transactionNotifArray,
                    function (txn, next) {
                        params = [txn.eventTypeId, txn.userId, txn.message];
                        db.query("insert into event_notification(eventType, userId, notificationDetails) values (?, ?, ?)", params, function (error, results) {
                            next(error);
                        })
                    },
                    function (err) {
                        sendMultipleNotifToTokenInternal(transactionNotifEnabled);
                    })
            }
            else {
                logger.error("Error while processing your request", errorGetFcmTokens);
            }
        });
    }
}




exports.sendNotifReferralApplied = function (data) {

    var userIds = data.ip_userOneId + ", " + data.ip_userTwoId;
    db.query('select userId, fcm_token from fcm_tokens where userId in (' + userIds + ')', function (errorGetFcmTokens, resultsGetFcmTokens) {
        if (!errorGetFcmTokens) {
            var arr = [];
            var msg = "Congrats! Your XP points are increased by 10";
            for (var i = 0; i < resultsGetFcmTokens.length; i++) {
                if (resultsGetFcmTokens[i].userId == data.ip_userOneId) {
                    if (data.ip_userOneIsNotifEnabled) {
                        arr.push({ "message": msg, "token": resultsGetFcmTokens[i].fcm_token })
                    }
                }
                else {
                    if (data.ip_userTwoIsNotifEnabled) {
                        arr.push({ "message": msg, "token": resultsGetFcmTokens[i].fcm_token })
                    }
                }
            }
            sendMultipleNotifToTokenInternal(arr);
        }
        else {
            logger.error("Error while processing your request", errorGetFcmTokens);
        }
    });


}



exports.sendNotifRewardDistributed = function (userNotifData) {

    if (userNotifData.length > 0) {
        var userIds = "";
        for (var i = 0; i < userNotifData.length; i++) {
            if (i == 0)
                userIds = userNotifData[i].userId;
            else
                userIds = userIds + ", " + userNotifData[i].userId;
        }
        var transactionNotifArray = [];
        db.query('select f.userId, f.fcm_token, u.isNotificationEnabled from users u join fcm_tokens f on u.userId = f.userId where u.userId in (' + userIds + ')', function (errorGetFcmTokens, resultsGetFcmTokens) {
            if (!errorGetFcmTokens) {
                var objRewardDistributionNotif = {};
                for (var j = 0; j < resultsGetFcmTokens.length; j++) {
                    for (var k = 0; k < userNotifData.length; k++) {
                        if (resultsGetFcmTokens[j].userId == userNotifData[k].userId) {
                            objRewardDistributionNotif.userId = resultsGetFcmTokens[j].userId;
                            objRewardDistributionNotif.message = userNotifData[k].message;
                            objRewardDistributionNotif.token = resultsGetFcmTokens[j].fcm_token;
                            objRewardDistributionNotif.isNotificationEnabled = resultsGetFcmTokens[j].isNotificationEnabled
                            objRewardDistributionNotif.eventTypeId = 1;
                            transactionNotifArray.push(objRewardDistributionNotif);
                        }
                    }
                }

                var transactionNotifEnabled = [];
                for (var x = 0; x < transactionNotifArray.length; x++) {
                    if (transactionNotifArray[x].isNotificationEnabled) {
                        transactionNotifEnabled.push(transactionNotifArray[x]);
                    }
                }
                each(transactionNotifArray,
                    function (txn, next) {
                        params = [txn.eventTypeId, txn.userId, txn.message];
                        db.query("insert into event_notification(eventType, userId, notificationDetails) values (?, ?, ?)", params, function (error, results) {
                            next(error);
                        })
                    },
                    function (err) {
                        sendMultipleNotifToTokenInternal(transactionNotifEnabled);
                    })
            }
            else {
                logger.error("Error while processing your request", errorGetFcmTokens);
            }
        });
    }

}


// pass array of json which contains tokens and messages
function sendMultipleNotifToTokenInternal(arr) {
    for (var i = 0; i < arr.length; i++) {
        // pass message body and fcm token
        sendMultipleNotifications(arr[i].message, arr[i].token, function () {
        });
    }
}

function sendMultipleNotifications(msg, token, callback) {

    var message = {
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: { "title": msg, "body": msg }
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: msg,
                        body: msg
                    },
                    sound: "default"
                }
            }
        },
        token: token
    };

    return new Promise((resolve, reject) => {
        console.info('Sending notification!')

        firebaseAdmin.messaging().send(message)
            .then((response) => {
                console.info('Notification message successfully sent:', response);
                logger.info("sendNotifToToken - ");
                resolve();
            })
            .catch((error) => {
                console.error('Error while sending notification: ', error);
                logger.error("Firebase error ", error);
                reject();
            });
    })
}
