var path = require('path');
var jwt = require("jsonwebtoken");
var config = require(path.resolve('./', 'config'));
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'));
var privateKey = config.privateKey;

exports.verifyToken = function (req, res, next) {

    var token = req.headers.auth;

    jwt.verify(token, privateKey, (err, decoded) => {
        if (err) {
            logger.error(msg.tokenInvalid);
            res.send(responseGenerator.getResponse(1050, msg.tokenInvalid, null))
        } else {
            req.result = decoded;
            next();
        }
    });

}
