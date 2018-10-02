
var path =require('path');
var api=require(path.resolve('.','modules/account/accountController.js'));
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'));
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();


// api to update account
router.post("/updateAccount", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAdminAuthorized, api.updateAccount);

module.exports=router;
