var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var transaction = require(path.resolve('.', 'modules/transaction/transactionController.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));


exports.updateEntity = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.updateEntity(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while updating entity - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while updating entity", error));
        }
        else if (response) {
            logger.info("Entity updated successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}