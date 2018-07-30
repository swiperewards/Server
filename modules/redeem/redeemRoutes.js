var path =require('path');
var api=require(path.resolve('.','modules/redeem/redeemController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var router=express.Router();

// api to get redeem options
router.post("/getRedeemOptions", encDecController.verifyToken, api.getRedeemOptions);

// api to raise redeem request for user
router.post("/raiseRedeemRequest", encDecController.verifyToken, api.raiseRedeemRequest);

module.exports=router;