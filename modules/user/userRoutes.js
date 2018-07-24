var path =require('path');
var api=require(path.resolve('.','modules/user/userController.js'))
var express = require('express');
var router=express.Router();

// api to register user
router.post("/registerUser", api.registerUser);

// api to login for android / ios app user
router.post("/loginUser", api.loginUser);

// api to change password for user
router.post("/changePassword", api.changePassword);

// api to toggle notification for user
router.post("/toggleNotification", api.toggleNotification);

// api to login for web user
router.post("/loginUserWeb", api.loginUserWeb);

module.exports=router;