var path =require('path');
var api=require(path.resolve('.','modules/user/userController.js'))
var express = require('express');
var router=express.Router();

// router.post('/registerUserOld',api.registerUserOld);
// router.post('/loginUserOld',api.loginUserOld);
router.post("/registerUser", api.registerUser);
router.post("/loginUser", api.loginUser);

module.exports=router;