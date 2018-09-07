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

function isTicketExists(ticketTypeName, callback) {
    params = [0, ticketTypeName]
    db.query("select id from mst_ticket_type where isDeleted = ? and ticketTypeName = ?", params, function (error, results) {
        if (!error) {
            if (results.length > 0) {
                logger.info("isTicketExists - ticketTypeName already exists");
                callback(true);
            }
            else {
                callback(false);
            }

        } else {
            logger.error("getTicketTypes - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}

exports.addTicketType = function (req, res) {

    // parameter to be passed to select ticket types
    isTicketExists(req.body.requestData.ticketTypeName, function (ifExist) {
        if (ifExist) {
            logger.info("addTicketType - ticketTypeName already exists - " + req.result.userId);
            res.send(responseGenerator.getResponse(1089, "Ticket type name already exists", null))
        }
        else {
            params = [req.body.requestData.ticketTypeName];
            db.query("insert into mst_ticket_type(ticketTypeName) values (?)", params, function (error, results) {
                if (!error) {
                    logger.info("addTicketType - ticketTypeName added successfully for user - " + req.result.userId);
                    res.send(responseGenerator.getResponse(200, "Success", null))
                } else {
                    logger.error("addTicketType - Error while processing your request", error);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, error))
                }
            })
        }

    })

}



exports.updateTicketType = function (req, res) {
    isTicketExists(req.body.requestData.ticketTypeName, function (ifExist) {
        if (ifExist) {
            logger.info("updateTicketType - ticketTypeName already exists - " + req.result.userId);
            res.send(responseGenerator.getResponse(1089, "Ticket type name already exists", null))
        }
        else {
            // parameter to be passed to update Ticket Type
            params = [req.body.requestData.ticketTypeName, new Date(Date.now()), req.body.requestData.id, 0];
            db.query("update mst_ticket_type set ticketTypeName = ?, modifiedDate = ? where id = ? and isDeleted = ?", params, function (error, results) {
                if (!error) {
                    if (results.affectedRows == 1) {
                        logger.info("updateTicketType - ticketTypeName updated successfully for user - " + req.result.userId);
                        res.send(responseGenerator.getResponse(200, "Success", null))
                    }
                    else {
                        logger.info("updateTicketType - ticketTypeName not exists - " + req.result.userId);
                        res.send(responseGenerator.getResponse(1090, "Ticket type name not exist", null))
                    }

                } else {
                    logger.error("updateTicketType - Error while processing your request", error);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, error))
                }
            })
        }
    });


}

exports.deleteTicketType = function (req, res) {

    // parameter to be passed to select ticket types
    params = [1, req.body.requestData.id];
    db.query("update mst_ticket_type set isDeleted = ? where id = ?", params, function (error, results) {
        if (!error) {
            logger.info("deleteTicketType - ticketTypeName deleted successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", null))
        } else {
            logger.error("deleteTicketType - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    })
}


exports.getTicketDetails = function (req, res) {

    // parameter to be passed to select ticket types
    params = [req.body.requestData.id]
    db.query("select * from mst_ticket_type where id = ?", params, function (error, results) {
        if (!error) {
            if (results.length > 0) {
                logger.info("getTicketDetails - ticket details fetched successfully for user - " + req.result.userId);
                res.send(responseGenerator.getResponse(200, "Success", results[0]))
            }
            else {
                logger.info("getTicketDetails - ticketTypeName not exists - " + req.result.userId);
                res.send(responseGenerator.getResponse(1090, "Ticket type name not exist", null))
            }

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



exports.updateTicket = function (req, res) {

    var ticket = {
        "ticketTypeId": req.body.requestData.ticketTypeId,
        "replyDescription": req.body.requestData.replyDescription,
        "id": req.body.requestData.id
    }
    // parameter to be passed to update Ticket Type
    params = [ticket.ticketTypeId, ticket.replyDescription, ticket.id, 0];
    db.query("update ticket set ticketTypeId = ?, replyDescription = ? where id = ? and isDeleted = ?", params, function (error, results) {
        if (!error) {
            if (results.affectedRows == 1) {
                logger.info("updateTicket - ticket updated successfully for user - " + req.result.userId);
                res.send(responseGenerator.getResponse(200, "Success", null))
            }
            else {
                logger.info("updateTicket - ticketTypeName not exists - " + req.result.userId);
                res.send(responseGenerator.getResponse(1090, "Ticket not exist", null))
            }

        } else {
            logger.error("updateTicketType - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    })

}