var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


exports.addCard = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);

                res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
            } else {
                var card = {
                    'cardNumber': req.body.requestData.cardNumber,
                    'expiryMonthMM': req.body.requestData.expiryMonthMM,
                    'expiryYearYYYY': req.body.requestData.expiryYearYYYY,
                    'cvv': req.body.requestData.cvv,
                    'nameOnCard': req.body.requestData.nameOnCard,
                    'userId': result.userId
                }
                // parameter to be passed to AddCard procedure
                var params = [card.cardNumber, card.expiryMonthMM, card.expiryYearYYYY,
                card.cvv, card.nameOnCard, card.userId]
                db.query("call AddCard(?,?,?,?,?,?)", params, function (error, results) {
                    if (!error) {
                        if (results[0][0].IsRecordExists) {
                            logger.info("Card already exists - " + results[0][0].id);
                            res.send(responseGenerator.getResponse(1051, "Card already exists", {
                                cardId: results[0][0].id
                            }))
                        }
                        else {
                            logger.info("Card added successfully - " + results[0][0].ip_NewCardID);
                            res.send(responseGenerator.getResponse(200, "Card added successfully", {
                                cardId: results[0][0].id,
                                createdDate: results[0][0].createdDate
                            }))
                        }

                    } else {
                        logger.error("Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
        });
    } else {
        logger.error(msg.tokenInvalid);

        res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))

    }

}



exports.getCards = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);

                res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
            } else {
                var card = {
                    'userId': result.userId
                }
                // parameter to be passed to select cards query
                params = [card.userId, 0]
                db.query("select * from cards where userId = ? and isDeleted = ?", params, function (error, results) {
                    if (!error) {
                        logger.info("Cards fetched successfully for user - " + card.userId);
                        res.send(responseGenerator.getResponse(200, "Success", results))
                    } else {
                        logger.error("Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
        });
    } else {
        logger.error(msg.tokenInvalid);

        res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))

    }

}



exports.deleteCard = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);

                res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
            } else {
                var card = {
                    'userId': result.userId,
                    'cardId': req.body.requestData.cardId
                }
                // parameter to be passed to select cards query
                params = [1, card.cardId, 0]
                db.query("update cards set isDeleted = ? where id = ? and isDeleted = ?", params, function (error, results) {
                    if (!error) {
                        if(results.affectedRows == 0){
                            logger.info("deleteCard - Card not exists for user - " + card.userId);
                            res.send(responseGenerator.getResponse(1052, "Card not exists", null))
                        }
                        else{
                            logger.info("deleteCard - Card deleted successfully for user - " + card.userId);
                            res.send(responseGenerator.getResponse(200, "Card deleted successfully", null))
                        }
                    } else {
                        logger.error("Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
        });
    } else {
        logger.error(msg.tokenInvalid);

        res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))

    }

}
