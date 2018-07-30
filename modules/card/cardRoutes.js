var path =require('path');
var api=require(path.resolve('.','modules/card/cardController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var router=express.Router();

// api to add card for user
router.post("/addCard", encDecController.verifyToken, api.addCard);

// api to get added cards for user
router.post("/getCards", encDecController.verifyToken, api.getCards);

// api to delete card for user
router.post("/deleteCard", encDecController.verifyToken, api.deleteCard);

module.exports=router;
