var path =require('path');
var api=require(path.resolve('.','modules/event/eventController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();

// api to get event notifications for user
router.post("/getEventNotifications", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getEventNotifications);

module.exports=router;
