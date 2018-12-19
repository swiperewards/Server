var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))
var transaction = require(path.resolve('.', 'modules/transaction/transactionController.js'));
var functions = require(path.resolve('./', 'utils/functions.js'));


exports.addCard = function (req, res) {

    var card = {
        'cardNumber': req.body.requestData.cardNumber,
        'expiryMonthMM': req.body.requestData.expiryMonthMM,
        'expiryYearYYYY': req.body.requestData.expiryYearYYYY,
        'cvv': req.body.requestData.cvv,
        'nameOnCard': req.body.requestData.nameOnCard,
        'userId': req.result.userId
    }
    // parameters to be passed to AddCard procedure
    var params = [card.cardNumber, card.expiryMonthMM, card.expiryYearYYYY,
    card.cvv, card.nameOnCard, card.userId]
    db.query("call AddCard(?,?,?,?,?,?)", params, function (errorAddCard, results) {
        if (!errorAddCard) {
            if (results[0][0].IsRecordExists) {
                logger.info("Card already exists - " + results[0][0].id);
                res.send(responseGenerator.getResponse(1051, "Card already exists", {
                    cardId: results[0][0].id
                }))
            }
            else {
                var Reqbody = req.body;
                // Reqbody.userId = req.result.userId;
                Reqbody.requestData.userId = req.result.userId;
                Reqbody.requestData.id = results[0][0].id
                Reqbody.requestData.availableXp = results[0][0].ip_AvailableXp;
                transaction.addCard(Reqbody, function (error, response) {
                    if (error) {
                        logger.info("Error while adding card - " + req.result.userId);
                        res.send(responseGenerator.getResponse(200, "Error while adding card", error));
                    }
                    else if (response) {
                        response.body.responseData = functions.decryptData(response.body.responseData);
                        if (response.body.status == 200) {
                            logger.info("Card added successfully - " + results[0][0].ip_NewCardID);
                            res.send(responseGenerator.getResponse(200, "Card added successfully", {
                                cardId: results[0][0].id,
                                createdDate: results[0][0].createdDate
                            }))
                        }
                        else {
                            db.query("delete from cards where id = ?", [results[0][0].id], function (errDelete, resultsDelete) {
                                logger.error("Error while processing your request", null);
                                res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                            });
                        }
                    }
                });

            }

        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })

}



exports.getCards = function (req, res) {

    var card = {
        'userId': req.result.userId
    }
    // parameter to be passed to select cards query
    params = [card.userId, 0]
    db.query("select * from cards where userId = ? and isDeleted = ?", params, function (error, results) {
        if (!error) {
            logger.info("Cards fetched successfully for user - " + card.userId);
            res.send(responseGenerator.getResponse(200, "Success", results));
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null));
        }
    })


}



exports.deleteCard = function (req, res) {

    var card = {
        'userId': req.result.userId,
        'cardId': req.body.requestData.cardId
    }
    // parameter to be passed to select cards query
    params = [1, card.cardId, 0]
    db.query("update cards set isDeleted = ? where id = ? and isDeleted = ?", params, function (error, results) {
        if (!error) {
            if (results.affectedRows == 0) {
                logger.info("deleteCard - Card not exists for user - " + card.userId);
                res.send(responseGenerator.getResponse(1052, "Card not exists", null))
            }
            else {
                logger.info("deleteCard - Card deleted successfully for user - " + card.userId);
                res.send(responseGenerator.getResponse(200, "Card deleted successfully", null))
            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })


}
