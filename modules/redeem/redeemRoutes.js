var path =require('path');
var api=require(path.resolve('.','modules/redeem/redeemController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var router=express.Router();

// api to get redeem options
router.post("/getRedeemOptions", encDecController.verifyToken, api.getRedeemOptions);

// api to raise redeem request for user
router.post("/raiseRedeemRequest", encDecController.verifyToken, api.raiseRedeemRequest);

// api to get redeem requests
router.post("/getRedeemRequests", encDecController.verifyToken, api.getRedeemRequests);

// api to raise redeem request for user
router.post("/raiseRedeemRequest", encDecController.verifyToken, api.raiseRedeemRequest);

// api to update redeem request for user
router.post("/updateRedeemRequest", encDecController.verifyToken, api.updateRedeemRequest);

// api to get redeem request
router.post("/getRedeemReqDetails", encDecController.verifyToken, api.getRedeemReqDetails);

// api to create redeem mode
router.post("/createRedeemMode", encDecController.verifyToken, api.createRedeemMode);


module.exports=router;
