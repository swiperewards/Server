


/* This is the sample route, we have created separate server to manage transactions */

var path = require('path');
var api = require(path.resolve('.', 'modules/notifications/notificationsController.js'));
var express = require('express');
var encDecController = require(path.resolve('.', 'modules/config/encryptDecryptController.js'));
var functions = require(path.resolve('.', 'utils/functions.js'));
var router = express.Router();

router.post("/addUpdateFcmToken", encDecController.verifyToken, api.addUpdateFcmToken);

router.post("/subscribeToTopic", encDecController.verifyToken, api.subscribeToTopic);

router.post("/unsubscribeFromTopic", encDecController.verifyToken, api.unsubscribeFromTopic);

router.post("/sendNotifToToken", encDecController.verifyToken, api.sendNotifToToken);

router.post("/sendNotifToTopic", encDecController.verifyToken, api.sendNotifToTopic);


module.exports = router;
