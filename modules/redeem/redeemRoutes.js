var path =require('path');
var api=require(path.resolve('.','modules/redeem/redeemController.js'))
var express = require('express');
var router=express.Router();

router.post("/getRedeemOptions", api.getRedeemOptions);

module.exports=router;