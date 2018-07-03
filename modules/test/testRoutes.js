var path =require('path');
var api=require(path.resolve('.','modules/test/testController.js'))
var express = require('express');
var router=express.Router();

router.get('/test',api.test);

module.exports=router;