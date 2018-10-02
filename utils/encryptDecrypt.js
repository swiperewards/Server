var cryptoJS = require("crypto-js");
var config = require(path.resolve('./', 'config'));

function decrypt(encText) {
    var plainText = cryptoJS.AES.decrypt(encText, secretKey);
    return plainText;
}

// method to encrypt data(password)
function encrypt(plainText) {
    var encText = cryptoJS.AES.encrypt(plainText, config.secretKey);
    return encText;
}

