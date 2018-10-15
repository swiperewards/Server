var path =require('path');
var api=require(path.resolve('.','modules/config/configController.js'))
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'));
var express = require('express');
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();

// api to get initial configuration info for user
router.post("/initSwipe", functions.decryptDataMiddleWare, api.initSwipe);

// api to get list of cities
router.post("/getCities", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getCities);

module.exports=router;
