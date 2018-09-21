var path =require('path');
var api=require(path.resolve('.','modules/user/userController.js'))
var express = require('express');
var multipart = require('connect-multiparty');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'));
var functions=require(path.resolve('.','utils/functions.js'));
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

// api to resend verification email for web user
router.post("/resendVerificationEmail", api.resendVerificationEmail);

// api to get user profile
router.post("/getUserProfile", encDecController.verifyToken, api.getUserProfile);

// api to register for web user
router.post("/registerUserWeb", api.registerUserWeb);

// api to get user profile
router.post("/activateAccount", api.activateAccount);

// api to update profile picture
router.post("/updateProfilePic", encDecController.verifyToken, api.updateProfilePic);

// api to update profile
router.post("/updateUserProfile", encDecController.verifyToken, api.updateUserProfile);

// api to send forgot password link to user
router.post("/forgotPassword", api.forgotPassword);

// api to set new password for user
router.post("/setPassword", api.setPassword);

// api to update admin
router.post("/updateAdmin", encDecController.verifyToken, functions.isSuperAdminAuthorized, api.updateAdmin);

// api to update user
router.post("/updateUser", encDecController.verifyToken, functions.isAdminAuthorized, api.updateUser);

// api to add admin
router.post("/addAdmin", encDecController.verifyToken, functions.isSuperAdminAuthorized, api.addAdmin);

// api to delete admin
router.post("/deleteAdmin", encDecController.verifyToken, functions.isSuperAdminAuthorized, api.deleteAdmin);

// api to delete user
router.post("/deleteUser", encDecController.verifyToken, functions.isAdminAuthorized, api.deleteUser);

// api to get admin details
router.post("/getAdminDetails", encDecController.verifyToken, functions.isSuperAdminAuthorized, api.getAdminDetails);

// api to get user details
router.post("/getUserDetails", encDecController.verifyToken, functions.isAdminAuthorized, api.getUserDetails);

// api to get admins
router.post("/getAdmins", encDecController.verifyToken, functions.isSuperAdminAuthorized, api.getAdmins);

// api to get admins
router.post("/getUsers", encDecController.verifyToken, functions.isAdminAuthorized, api.getUsers);

// api to list Buckets
router.post("/listBuckets", encDecController.verifyToken, api.listBuckets);

// api to apply referral code
router.post("/applyReferralCode", encDecController.verifyToken, api.applyReferralCode);

module.exports=router;
