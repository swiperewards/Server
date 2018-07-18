var path =require('path');
var api=require(path.resolve('.','modules/deal/dealController.js'))
var express = require('express');
var router=express.Router();

router.get("/getDeals", api.getDeals);

module.exports=router;