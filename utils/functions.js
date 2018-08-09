var path = require('path');
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
const CryptoJS = require("crypto-js");



/**
 * Function for Encrypting the data
 */
function encryptData(data)
{
        var dataString = JSON.stringify(data);
        var response = CryptoJS.AES.encrypt(dataString, config.cryptokey);
        return response.toString();
}

/**
 * Function for decrypting the data
 */
function decryptData(data)
{
        var decrypted = CryptoJS.AES.decrypt(data, config.cryptokey);
        if(decrypted)
        {
            var userinfo = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
            return userinfo;
        }
        else
        {
            return {"userinfo": { "error": "Please send proper token"}};
        }
}


module.exports = {
    encryptData: encryptData,
    decryptData: decryptData
};