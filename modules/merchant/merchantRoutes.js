


/* This is the sample route, we have created separate server to manage transactions */

var path =require('path');
var api=require(path.resolve('.','modules/merchant/merchantController.js'));
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'));
var router=express.Router();

// api to get merchants
router.post("/getMerchants", encDecController.verifyToken, api.getMerchants);

// api to create merchant
router.post("/createMerchant", encDecController.verifyToken, api.createMerchant);

module.exports=router;
