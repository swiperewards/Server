var path =require('path');
var api=require(path.resolve('.','modules/deal/dealController.js'))
var express = require('express');
var router=express.Router();
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))

// api to get all existing deals
router.post("/getDeals", encDecController.verifyToken, api.getDeals);

// api to get existing deals with pagination
router.post("/getDealsWithPaging", encDecController.verifyToken, api.getDealsWithPaging);

module.exports=router;