


/* This is the sample route, we have created separate server to manage transactions */

var path = require('path');
var api = require(path.resolve('.', 'modules/member/memberController.js'));
var express = require('express');
var encDecController = require(path.resolve('.', 'modules/config/encryptDecryptController.js'));
var functions = require(path.resolve('.', 'utils/functions.js'));
var router = express.Router();

// api to update member
router.post("/updateMember", encDecController.verifyToken, functions.isAdminAuthorized, api.updateMember);


module.exports = router;
