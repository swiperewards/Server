var path =require('path');
var api=require(path.resolve('.','modules/redeem/redeemController.js'))
var express = require('express');
var router=express.Router();

// api to get redeem options
router.post("/getRedeemOptions", api.getRedeemOptions);

// api to raise redeem request for user
router.post("/raiseRedeemRequest", api.raiseRedeemRequest);

module.exports=router;