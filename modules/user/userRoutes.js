var path =require('path');
var api=require(path.resolve('.','modules/user/userController.js'))
var express = require('express');
var multipart = require('connect-multiparty');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var multipartMiddleware = multipart();
var router=express.Router();

// api to register user
router.post('/registerUser', api.registerUser);

// api to login for android / ios app user
router.post("/loginUser", api.loginUser);

// api to change password for user
router.post("/changePassword", encDecController.verifyToken, api.changePassword);

// api to toggle notification for user
router.post("/toggleNotification", encDecController.verifyToken, api.toggleNotification);

// api to login for web user
router.post("/loginUserWeb", api.loginUserWeb);

// api to register for web user
router.post("/registerUserWeb", api.registerUser);

// api to update profile picture
router.post("/updateProfilePic", encDecController.verifyToken, multipartMiddleware, api.updateProfilePic);

// api to send forgot password link to user
router.post("/forgotPassword", api.forgotPassword);

// api to set new password for user
router.post("/setPassword", api.setPassword);


module.exports=router;