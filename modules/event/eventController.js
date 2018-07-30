var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


exports.getEventNotifications = function (req, res) {

    // parameter to be passed to select ticket types
    params = [req.result.userId, 0]
    db.query("select eventId, eventType, notificationDate, notificationDetails, transactionAmount, isCredit from event_notification where userId = ? and isDeleted = ?", params, function (error, results) {
        if (!error) {
            logger.info("getEventNotifications - event notifications fetched successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", results))
        } else {
            logger.error("getEventNotifications - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })

}

