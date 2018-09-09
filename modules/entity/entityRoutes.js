


/* This is the sample route, we have created separate server to manage transactions */

var path =require('path');
var api=require(path.resolve('.','modules/entity/entityController.js'));
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'));
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();

// api to update entity
router.post("/updateEntity", encDecController.verifyToken, functions.isAdminAuthorized, api.updateEntity);


module.exports=router;
