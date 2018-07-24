var path =require('path');
var api=require(path.resolve('.','modules/deal/dealController.js'))
var express = require('express');
var router=express.Router();

// api to get all existing deals
router.post("/getDeals", api.getDeals);

// api to get existing deals with pagination
router.post("/getDealsWithPaging", api.getDealsWithPaging);

module.exports=router;