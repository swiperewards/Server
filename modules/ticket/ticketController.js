var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


exports.getTicketTypes = function (req, res) {

    // parameter to be passed to select ticket types
    params = [0, 1]
    db.query("select id, ticketTypeName from mst_ticket_type where isDeleted = ? and status = ?", params, function (error, results) {
        if (!error) {
            logger.info("getTicketTypes - ticketTypeName fetched successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", results))
        } else {
            logger.error("getTicketTypes - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


exports.generateTicket = function (req, res) {

    var ticket = {
        "userId": req.result.userId,
        "ticketTypeId": req.body.requestData.ticketTypeId,
        "feedback": req.body.requestData.feedback,
        "userCategory": req.body.requestData.userCategory
    }
    // parameter to be passed to select ticket types
    params = [ticket.userId, ticket.ticketTypeId, ticket.feedback, ticket.userCategory]
    db.query('call GenerateTicket(?,?,?,?)', params, function (error, results) {
        if (!error) {
            logger.error("generateTicket - ticket generated successfully by -" + ticket.userId);
            res.send(responseGenerator.getResponse(200, "Ticket generated successfully", results[0][0]))
        }
        else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}
