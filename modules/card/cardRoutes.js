var path =require('path');
var api=require(path.resolve('.','modules/card/cardController.js'))
var express = require('express');
var router=express.Router();

router.post("/addCard", api.addCard);
router.post("/getCards", api.getCards);

module.exports=router;