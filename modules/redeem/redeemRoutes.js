var path =require('path');
var api=require(path.resolve('.','modules/redeem/redeemController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var router=express.Router();

// api to get redeem options
router.post("/getRedeemOptions", encDecController.verifyToken, api.getRedeemOptions);

// api to get redeem option details
router.post("/getRedeemOptionsDetails", encDecController.verifyToken, api.getRedeemOptionsDetails);

// api to raise redeem request for user
router.post("/raiseRedeemRequest", encDecController.verifyToken, api.raiseRedeemRequest);

// api to get redeem requests
router.post("/getRedeemRequests", encDecController.verifyToken, api.getRedeemRequests);

// api to update redeem request for user
router.post("/updateRedeemRequest", encDecController.verifyToken, api.updateRedeemRequest);

// api to approve redeem request for user
router.post("/approveRedeemRequest", encDecController.verifyToken, api.approveRedeemRequest);

// api to reject redeem request for user
router.post("/rejectRedeemRequest", encDecController.verifyToken, api.rejectRedeemRequest);

// api to get redeem request
router.post("/getRedeemReqDetails", encDecController.verifyToken, api.getRedeemReqDetails);

// api to create redeem mode
router.post("/createRedeemMode", encDecController.verifyToken, api.createRedeemMode);

// api to delete redeem mode
router.post("/deleteRedeemMode", encDecController.verifyToken, api.deleteRedeemMode);

// api to update redeem mode
router.post("/updateRedeemMode", encDecController.verifyToken, api.updateRedeemMode);

module.exports=router;
