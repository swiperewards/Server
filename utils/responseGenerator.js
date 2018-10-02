var path = require('path');
var config = require(path.resolve('./', 'config'));
var functions = require(path.resolve('./', 'utils/functions.js'));

exports.getResponse = function (status, msg, data) {

    if(config.isEncryptionEnabled){
        var encData = functions.encryptData(data);
        var response = {
            "status": status,
            "message": msg,
            "responseData": encData
        }
        return response;
    }
    else {
        var response = {
            "status": status,
            "message": msg,
            "responseData": data
        }
        return response;
    }
    
}