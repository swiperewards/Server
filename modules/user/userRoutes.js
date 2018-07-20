var path =require('path');
var api=require(path.resolve('.','modules/user/userController.js'))
var express = require('express');
var router=express.Router();

router.post("/registerUser", api.registerUser);
router.post("/loginUser", api.loginUser);
router.post("/changePassword", api.changePassword);

module.exports=router;