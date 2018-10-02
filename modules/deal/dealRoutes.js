var path =require('path');
var api=require(path.resolve('.','modules/deal/dealController.js'))
var express = require('express');
var router=express.Router();
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var functions=require(path.resolve('.','utils/functions.js'));

// api to get existing deals with pagination
router.post("/getDealsWithPaging", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getDealsWithPaging);

// api to get all existing deals for web
router.post("/getDealsWeb", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getDealsWeb);

// api to get deal details for web
router.post("/getDealDetailsWeb", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getDealDetailsWeb);

// api to add deal
router.post("/addDeal", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAuthorized, api.addDeal);

// api to update deal
router.post("/updateDeal", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAuthorized, api.updateDeal);

// api to delete deal
router.post("/deleteDeal", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAuthorized, api.deleteDeal);


module.exports=router;
