var path =require('path');
var api=require(path.resolve('.','modules/redeem/redeemController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();

// api to get redeem options
router.post("/getRedeemOptions", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getRedeemOptions);

// api to get redeem option details
router.post("/getRedeemOptionsDetails", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getRedeemOptionsDetails);

// api to raise redeem request for user
router.post("/raiseRedeemRequest", functions.decryptDataMiddleWare, encDecController.verifyToken, api.raiseRedeemRequest);

// api to get redeem requests
router.post("/getRedeemRequests", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getRedeemRequests);

// api to update redeem request for user
router.post("/updateRedeemRequest", functions.decryptDataMiddleWare, encDecController.verifyToken, api.updateRedeemRequest);

// api to approve redeem request for user
router.post("/approveRedeemRequest", functions.decryptDataMiddleWare, encDecController.verifyToken, api.approveRedeemRequest);

// api to reject redeem request for user
router.post("/rejectRedeemRequest", functions.decryptDataMiddleWare, encDecController.verifyToken, api.rejectRedeemRequest);

// api to get redeem request
router.post("/getRedeemReqDetails", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getRedeemReqDetails);

// api to create redeem mode
router.post("/createRedeemMode", functions.decryptDataMiddleWare, encDecController.verifyToken, api.createRedeemMode);

// api to delete redeem mode
router.post("/deleteRedeemMode", functions.decryptDataMiddleWare, encDecController.verifyToken, api.deleteRedeemMode);

// api to update redeem mode
router.post("/updateRedeemMode", functions.decryptDataMiddleWare, encDecController.verifyToken, api.updateRedeemMode);

module.exports=router;
