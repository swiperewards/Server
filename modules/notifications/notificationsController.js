var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));
var firebaseAdmin = require('firebase-admin');
var serviceAccount = require(path.resolve('.', 'nouvo-android-app-firebase-adminsdk-j1tge-6b1f7ff3cd.json'));

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://nouvo-android-app.firebaseio.com"
});


exports.sendNotifToToken = function (req, res) {
    var fcmToken = {
        'token': req.body.requestData.token,
        'userId': req.result.userId,
        'notifBody': req.body.requestData.notifBody
    }
    // var token = "eJjFtWuQq3s:APA91bFad7dbkjiBcRQlcpZeIcTcyer5hgQLur_gePIB8by0N9TkKeoPXuU7EgmHChJXTZfoz3vYQhq-f8TFeikrLnRFqIgTi4XkGrIdJ_kcKih-LFIw3ZLRs7m-9Tddx7rG0I0vy5Cm";
    var message = {
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: fcmToken.notifBody
        },
        token: fcmToken.token
    };
    sendNotifications(message)
        .then(() => {
            logger.info("sendNotifToToken - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Notification sent successfully", null));
        })
        .catch((error) => {
            logger.error("Firebase error", error);
            res.send(responseGenerator.getResponse(1098, "Firebase error", error))
        })
}

exports.sendNotifToTopic = function (req, res) {
    var fcmToken = {
        'topic': req.body.requestData.topic,
        'userId': req.result.userId,
        'notifBody': req.body.requestData.notifBody
    }
    // var token = "eJjFtWuQq3s:APA91bFad7dbkjiBcRQlcpZeIcTcyer5hgQLur_gePIB8by0N9TkKeoPXuU7EgmHChJXTZfoz3vYQhq-f8TFeikrLnRFqIgTi4XkGrIdJ_kcKih-LFIw3ZLRs7m-9Tddx7rG0I0vy5Cm";
    var message = {
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: fcmToken.notifBody
        },
        topic: fcmToken.topic
    };
    sendNotifications(message)
        .then(() => {
            logger.info("sendNotifToToken - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Notification sent successfully", null));
        })
        .catch((error) => {
            logger.error("Firebase error", error);
            res.send(responseGenerator.getResponse(1098, "Firebase error", error))
        })
}

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
            console.log('Error subscribing to topic:', error);
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
            console.log('Error subscribing to topic:', error);
        });
}


function sendNotifications(message) {
    return new Promise((resolve, reject) => {
        console.info('Sending notification!')
        firebaseAdmin.messaging().send(message)
            .then((response) => {
                console.info('Notification message successfully sent:', response);
                resolve();
                // return ({ "val": "success" });
            })
            .catch((error) => {
                console.error('Error while sending notification: ', error);
                reject({ code: 500, message: "Error while sending notification", error: error });
                // return ({ code: 500, message: "Error while sending notification", error: error });
            });
    })
}