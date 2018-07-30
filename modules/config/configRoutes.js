var path =require('path');
var api=require(path.resolve('.','modules/config/configController.js'))
var express = require('express');
var router=express.Router();

// api to get initial configuration info for user
router.post("/initSwipe", api.initSwipe);

module.exports=router;