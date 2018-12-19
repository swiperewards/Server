


/* This is the sample route, we have created separate server to manage transactions */

var path = require('path');
var api = require(path.resolve('.', 'modules/notifications/notificationsController.js'));
var express = require('express');
var encDecController = require(path.resolve('.', 'modules/config/encryptDecryptController.js'));
var functions = require(path.resolve('.', 'utils/functions.js'));
var router = express.Router();

router.post("/addUpdateFcmToken", functions.decryptDataMiddleWare, encDecController.verifyToken, api.addUpdateFcmToken);

router.post("/subscribeToTopic", functions.decryptDataMiddleWare, encDecController.verifyToken, api.subscribeToTopic);

router.post("/unsubscribeFromTopic", functions.decryptDataMiddleWare, encDecController.verifyToken, api.unsubscribeFromTopic);

// router.post("/sendNotifToToken", functions.decryptDataMiddleWare, encDecController.verifyToken, api.sendNotifToToken);

// router.post("/sendNotifToTopic", functions.decryptDataMiddleWare, encDecController.verifyToken, api.sendNotifToTopic);

// api to send notifications to users, called from transaction server
router.post("/sendNotifToUsers", functions.decryptDataMiddleWare, api.sendNotifToUsers);

router.post("/sendNotifLevelUp", api.sendNotifLevelUp);

router.post("/sendNotifLevelUpAfterTxns", api.sendNotifLevelUpAfterTxns);

module.exports = router;
