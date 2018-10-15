var path = require('path');
var api = require(path.resolve('.', 'modules/user/userController.js'))
var express = require('express');
var multipart = require('connect-multiparty');
var encDecController = require(path.resolve('.', 'modules/config/encryptDecryptController.js'));
var functions = require(path.resolve('.', 'utils/functions.js'));
var multipartMiddleware = multipart();
var router = express.Router();

// api to register user
router.post('/registerUser', functions.decryptDataMiddleWare, api.registerUser);

// api to login for android / ios app user
router.post("/loginUser", functions.decryptDataMiddleWare, api.loginUser);

// api to change password for user..
router.post("/changePassword", functions.decryptDataMiddleWare, encDecController.verifyToken, api.changePassword);

// api to toggle notification for user
router.post("/toggleNotification", functions.decryptDataMiddleWare, encDecController.verifyToken, api.toggleNotification);

// api to login for web user
router.post("/loginUserWeb", functions.decryptDataMiddleWare, api.loginUserWeb);

// api to resend verification email for web user
router.post("/resendVerificationEmail", functions.decryptDataMiddleWare, api.resendVerificationEmail);

// api to get user profile
router.post("/getUserProfile", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getUserProfile);

// api to register for web user
router.post("/registerUserWeb", functions.decryptDataMiddleWare, api.registerUserWeb);

// api to get user profile
router.post("/activateAccount", functions.decryptDataMiddleWare, api.activateAccount);

// api to update profile picture
router.post("/updateProfilePic", functions.decryptDataMiddleWare, encDecController.verifyToken, api.updateProfilePic);

// api to update profile..
router.post("/updateUserProfile", functions.decryptDataMiddleWare, encDecController.verifyToken, api.updateUserProfile);

// api to send forgot password link to user
router.post("/forgotPassword", functions.decryptDataMiddleWare, api.forgotPassword);

// api to set new password for user..
router.post("/setPassword", functions.decryptDataMiddleWare, api.setPassword);

// api to update admin
router.post("/updateAdmin", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isSuperAdminAuthorized, api.updateAdmin);

// api to update user..
router.post("/updateUser", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAdminAuthorized, api.updateUser);

// api to add admin
router.post("/addAdmin", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isSuperAdminAuthorized, api.addAdmin);

// api to delete admin
router.post("/deleteAdmin", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isSuperAdminAuthorized, api.deleteAdmin);

// api to delete user
router.post("/deleteUser", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAdminAuthorized, api.deleteUser);

// api to get admin details
router.post("/getAdminDetails", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isSuperAdminAuthorized, api.getAdminDetails);

// api to get user details
router.post("/getUserDetails", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAdminAuthorized, api.getUserDetails);

// api to get admins
router.post("/getAdmins", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isSuperAdminAuthorized, api.getAdmins);

// api to get admins
router.post("/getUsers", functions.decryptDataMiddleWare, encDecController.verifyToken, functions.isAdminAuthorized, api.getUsers);

// api to list Buckets
router.post("/listBuckets", functions.decryptDataMiddleWare, encDecController.verifyToken, api.listBuckets);

// api to apply referral code
router.post("/applyReferralCode", functions.decryptDataMiddleWare, encDecController.verifyToken, api.applyReferralCode);

// api to get dashboard data
router.post('/dashboard', functions.decryptDataMiddleWare, encDecController.verifyToken, api.dashboard);

// test
router.post("/testDecrypt", encDecController.verifyToken, api.test);

router.post("/testEncrypt", encDecController.verifyToken, api.testEncrypt);


module.exports = router;
