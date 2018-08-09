var path = require('path');
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var request = require('request');

function createMerchant(ReqBody, callback) {

    request({
        url: config.transactionApiUrl + "/merchant/createMerchant",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true,
        body: ReqBody
    }, function (err, res) {
        callback(err, res);
    })

}

module.exports = {
    createMerchant: createMerchant
}

