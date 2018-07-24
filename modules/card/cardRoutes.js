var path =require('path');
var api=require(path.resolve('.','modules/card/cardController.js'))
var express = require('express');
var router=express.Router();

// api to add card for user
router.post("/addCard", api.addCard);

// api to get added cards for user
router.post("/getCards", api.getCards);

// api to delete card for user
router.post("/deleteCard", api.deleteCard);

module.exports=router;
