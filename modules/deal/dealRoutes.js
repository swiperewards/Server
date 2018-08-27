var path =require('path');
var api=require(path.resolve('.','modules/deal/dealController.js'))
var express = require('express');
var router=express.Router();
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var functions=require(path.resolve('.','utils/functions.js'));

// api to get all existing deals
router.post("/getDeals", encDecController.verifyToken, api.getDeals);

// api to get existing deals with pagination
router.post("/getDealsWithPaging", encDecController.verifyToken, api.getDealsWithPaging);

// api to add deal
router.post("/addDeal", encDecController.verifyToken, functions.isAuthorized, api.addDeal);


module.exports=router;
