


/* This is the sample route, we have created separate server to manage transactions */

var path =require('path');
var api=require(path.resolve('.','modules/merchant/merchantController.js'));
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'));
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();

// api to create merchant
router.post("/createMerchant", encDecController.verifyToken, functions.isAdminAuthorized, api.createMerchant);

// api to get merchants list
router.post("/getMerchants", encDecController.verifyToken, functions.isAdminAuthorized, api.getMerchants);

// api to get merchants list
router.post("/getMerchantsWithFilter", encDecController.verifyToken, functions.isAdminAuthorized, api.getMerchantsWithFilter);

// api to get merchant details
router.post("/getMerchantDetails", encDecController.verifyToken, functions.isAuthorized, api.getMerchantDetails);

// api to delete merchant
router.post("/deleteMerchant", encDecController.verifyToken, functions.isAdminAuthorized, api.deleteMerchant);

// api to update merchant
router.post("/updateMerchant", encDecController.verifyToken, functions.isAdminAuthorized, api.updateMerchant);

// api to update merchant details
router.post("/updateMerchantDetails", encDecController.verifyToken, functions.isAdminAuthorized, api.updateMerchantDetails);



module.exports=router;