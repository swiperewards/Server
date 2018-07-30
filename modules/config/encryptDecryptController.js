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
            res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
        } else {
            req.result = decoded;
            next();
        }
    });

}

exports.decryptToken = function (req, res) {
    var token = req.headers.authorization;
    //  console.log(token);
    jwt.verify(token, privateKey, (err, decoded) => {
        if (err) {
            console.log(err);
            res.status(200).json(
                responseGenerator.getResponse(false, "Session expired, please re-login.", 403)
            )
        } else {
            console.log(decoded);
            if (decoded === null || decoded.length <= 0) {

                res.status(200).json(responseGenerator.getResponse(false, "Session expired, please re-login.", 403));
            } else {
                res.send(responseGenerator.getResponse(true, "Decrypted successfully", decoded.data))
            }

        }
    });
}

exports.encryptString = function (req, res) {
    var token = jwt.sign({ "data": req.body.value }, privateKey, { expiresIn: '1 days' });
    res.send(responseGenerator.getResponse(true, "encrypted Successfully", token))
}

exports.decryptString = function (req, res) {
    // var token = req.headers.authorization;
    var token = req.body.token;
    //  console.log(token);
    jwt.verify(token, privateKey, (err, decoded) => {
        if (err) {
            console.log(err);
            res.status(200).json(
                responseGenerator.getResponse(false, "Session expired, please re-login.", 404)
            )
        } else {
            console.log(decoded);
            if (decoded === null || decoded.length <= 0) {

                res.status(200).json(responseGenerator.getResponse(false, "Session expired, please re-login.", 404));
            } else {
                res.send(responseGenerator.getResponse(true, "Decrypted successfully", decoded.data))
            }

        }
    });
}