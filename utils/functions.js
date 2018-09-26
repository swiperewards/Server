var path = require('path');
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
const CryptoJS = require("crypto-js");
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));


function decrypt(encryptedText) {
    var encrypted = CryptoJS.AES.decrypt(encryptedText, config.secretKey);
    var plainText = encrypted.toString(CryptoJS.enc.Utf8);
    if (plainText == "")
        return null;
    else
        return plainText;
}

// method to encrypt data(password)
function encrypt(plainText) {
    var encrypted = CryptoJS.AES.encrypt(plainText, config.secretKey);
    var encryptedText = encrypted.toString();
    return encryptedText;
}


/**
 * Function for Encrypting the data
 */
function encryptData(data) {
    var dataString = JSON.stringify(data);
    var response = CryptoJS.AES.encrypt(dataString, config.cryptokey);
    return response.toString();
}

/**
 * Function for decrypting the data
 */
function decryptData(data) {
    var decrypted = CryptoJS.AES.decrypt(data, config.cryptokey);
    if (decrypted) {
        var userinfo = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
        return userinfo;
    }
    else {
        return { "userinfo": { "error": "Please send proper token" } };
    }
}

function isAdminAuthorized(req, res, next) {
    var query = "select roleId from users where userId = ?";
    var params = [req.result.userId];
    db.query(query, params, function (error, results) {
        if (!error) {
            if (results.length > 0) {
                if ((results[0].roleId == 1) || (results[0].roleId == 2)) {
                    next();
                }
                else {
                    logger.error(msg.notAuthorized);
                    res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
                }
            }
            else {
                logger.error(msg.notAuthorized);
                res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


function isSuperAdminAuthorized(req, res, next) {
    var query = "select roleId from users where userId = ?";
    var params = [req.result.userId];
    db.query(query, params, function (error, results) {
        if (!error) {
            if (results.length > 0) {
                if (results[0].roleId == 1) {
                    next();
                }
                else {
                    logger.error(msg.notAuthorized);
                    res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
                }
            }
            else {
                logger.error(msg.notAuthorized);
                res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


function isAuthorized(req, res, next) {
    var query = "select roleId from users where userId = ?";
    var params = [req.result.userId];
    db.query(query, params, function (error, results) {
        if (!error) {
            if (results.length > 0) {
                if ((results[0].roleId == 1) || (results[0].roleId == 2) || (results[0].roleId == 3)) {
                    req.result.roleId = results[0].roleId;
                    next();
                }
                else {
                    logger.error(msg.notAuthorized);
                    res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
                }
            }
            else {
                logger.error(msg.notAuthorized);
                res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


module.exports = {
    decrypt: decrypt,
    encrypt: encrypt,
    encryptData: encryptData,
    decryptData: decryptData,
    isAdminAuthorized: isAdminAuthorized,
    isAuthorized: isAuthorized,
    isSuperAdminAuthorized: isSuperAdminAuthorized
};