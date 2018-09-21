var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


// not used
exports.getDeals = function (req, res) {

    var deal = {
        'location': req.body.requestData.location
    }
    // parameter to be passed to get deals query
    params = [deal.location, 0]
    db.query("select * from deals where location = ? and isDeleted = ?", params, function (error, results) {
        if (!error) {
            logger.info("Deals fetched successfully by user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", results))
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}



exports.getDealsWithPaging = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);
                res.send(responseGenerator.getResponse(1050, msg.tokenInvalid, null))
            } else {
                var deals = {
                    'location': req.body.requestData.location,
                    'pageNumber': req.body.requestData.pageNumber,
                    'pageSize': req.body.requestData.pageSize
                }
                // parameter to be passed to GetDeals procedure
                params = [deals.location, deals.pageNumber, deals.pageSize]
                db.query('call GetDeals(?,?,?)', params, function (error, results) {
                    if (!error) {
                        logger.error("getDealsWithPaging - success -" + req.result.userId);
                        res.send(responseGenerator.getResponse(200, "Success", results[1]))
                    }
                    else {
                        logger.error("getDealsWithPaging - Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                });
            }
        });
    } else {
        logger.error(msg.tokenInvalid);

        res.send(responseGenerator.getResponse(1050, msg.tokenInvalid, null))

    }

}



exports.getDealsWeb = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);
                res.send(responseGenerator.getResponse(1050, msg.tokenInvalid, null))
            } else {
                var deals = {
                    'merchantName': req.body.requestData.merchantName ? ('%' + req.body.requestData.merchantName + '%') : '%%',
                    'status': req.body.requestData.status ? ((req.body.requestData.status == '1') ? '%1%' : '%0%') : '%%',
                    'location': req.body.requestData.location ? ('%' + req.body.requestData.location + '%') : '%%',
                    'fromDate': req.body.requestData.fromDate != "" ? req.body.requestData.fromDate : '',
                    'toDate': req.body.requestData.toDate != "" ? req.body.requestData.toDate : '',
                    'pageNumber': req.body.requestData.pageNumber ? req.body.requestData.pageNumber : 0,
                    'pageSize': req.body.requestData.pageSize ? req.body.requestData.pageSize : 0
                }
                // parameter to be passed to GetDeals procedure
                params = [deals.merchantName, deals.status, deals.location, deals.fromDate, deals.toDate, deals.pageNumber, deals.pageSize]
                db.query('call GetDealsWeb(?,?,?,?,?,?,?)', params, function (error, results) {
                    if (!error) {
                        logger.error("getDealsWeb - success -" + req.result.userId);
                        var deals = [];
                        for (var i = 0; i < results[0].length; i++) {
                            var obj = results[0][i];
                            obj.serial_number = i + 1;
                            deals.push(obj);
                        }
                        res.send(responseGenerator.getResponse(200, "Success", deals))
                    }
                    else {
                        logger.error("getDealsWeb - Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                });
            }
        });
    } else {
        logger.error(msg.tokenInvalid);

        res.send(responseGenerator.getResponse(1050, msg.tokenInvalid, null))

    }

}

exports.getDealDetailsWeb = function (req, res) {

    var deal = {
        'id': req.body.requestData.id
    }
    // parameter to be passed to get deals query
    params = [0, deal.id];
    db.query("select md.merchantId, d.id, md.entityName, d.shortDescription, d.longDescription, d.startDate, d.endDate, d.cashBonus, d.status, d.location from deals d inner join merchantdata md on d.merchantId = md.userId where d.isDeleted = ? and d.id = ?", params, function (error, results) {
        if (!error) {
            logger.info("Deal fetched successfully by user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", results[0]))
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    })
}


exports.addDeal = function (req, res) {
    params = [req.body.requestData.merchantId]
    db.query('select userId from users where merchantId = ?', params, function (errorGetUserId, resultsGetUserId) {
        if (!errorGetUserId) {
            if(resultsGetUserId.length > 0){
                var deal = {
                    "merchantUserId": resultsGetUserId[0].userId,
                    "shortDescription": req.body.requestData.shortDescription ? req.body.requestData.shortDescription : null,
                    "longDescription": req.body.requestData.longDescription ? req.body.requestData.longDescription : null,
                    "startDate": req.body.requestData.startDate ? req.body.requestData.startDate : null,
                    "endDate": req.body.requestData.endDate ? req.body.requestData.endDate : null,
                    "cashBonus": req.body.requestData.cashBonus ? req.body.requestData.cashBonus : null,
                    "icon": req.body.requestData.icon ? req.body.requestData.icon : null,
                    "createdBy": req.result.userId,
                    "location": req.body.requestData.location ? req.body.requestData.location : null,
                    "latitude": req.body.requestData.latitude ? req.body.requestData.latitude : null,
                    "longitude": req.body.requestData.longitude ? req.body.requestData.longitude : null,
                    "status": (req.body.requestData.status == "1") ? "1" : "0"
                }
                // parameter to be passed
                params = [deal.merchantUserId, deal.shortDescription, deal.longDescription,
                deal.startDate, deal.endDate, deal.cashBonus, deal.icon, deal.createdBy, deal.location,
                deal.latitude, deal.longitude, deal.status]
                db.query('call addDeal(?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results) {
                    if (!error) {
                        logger.error("addDeal - ticket generated successfully by -" + deal.userId);
                        res.send(responseGenerator.getResponse(200, "Deal added successfully", results[0][0]))
                    }
                    else {
                        logger.error("Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                });
            }
            else {
                logger.error("Something went wrong", null);
                res.send(responseGenerator.getResponse(1083, "Something went wrong", null))
            }
        }
        else {
            logger.error("Error while processing your request", errorGetUserId);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}



exports.updateDeal = function (req, res) {

    var deal = {
        "id": req.body.requestData.id ? req.body.requestData.id : null,
        "merchantId": req.body.requestData.merchantId ? req.body.requestData.merchantId : null,
        "shortDescription": req.body.requestData.shortDescription ? req.body.requestData.shortDescription : null,
        "longDescription": req.body.requestData.longDescription ? req.body.requestData.longDescription : null,
        "startDate": req.body.requestData.startDate ? req.body.requestData.startDate : null,
        "endDate": req.body.requestData.endDate ? req.body.requestData.endDate : null,
        "cashBonus": req.body.requestData.cashBonus ? req.body.requestData.cashBonus : null,
        "icon": req.body.requestData.icon ? req.body.requestData.icon : null,
        "location": req.body.requestData.location ? req.body.requestData.location : null,
        "latitude": req.body.requestData.latitude ? req.body.requestData.latitude : null,
        "longitude": req.body.requestData.longitude ? req.body.requestData.longitude : null,
        "status": (req.body.requestData.status == "1") ? "1" : "0"
    }



    // parameter to be passed
    params = [deal.shortDescription, deal.longDescription,
    deal.startDate, deal.endDate, deal.cashBonus, deal.icon, deal.location,
    deal.latitude, deal.longitude, new Date(Date.now()), deal.status, deal.id, 0];

    var query = "update deals set shortDescription = ?, longDescription = ?, " +
        "startDate = ?, endDate = ?, cashBonus = ?, icon = ?, location = ?, latitude = ?, longitude = ?, " +
        "modifiedDate = ?, status = ? where id = ? and isDeleted = ?";

    db.query(query, params, function (errorUpdateDeal, resultsUpdateDeal) {
        if (!errorUpdateDeal) {
            if (resultsUpdateDeal.affectedRows == 1) {
                logger.info("Deal updated successfully");
                res.send(responseGenerator.getResponse(200, "Deal updated successfully", deal));
            }
            else {
                logger.info("updateDeal - Invalid deal id - " + req.result.userId);
                res.send(responseGenerator.getResponse(1085, "Invalid deal id", null));
            }
        }
        else {
            logger.error("updateDeal - Error while processing your request", errorUpdateDeal);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorUpdateDeal))
        }
    });

}



exports.deleteDeal = function (req, res) {

    var deal = {
        "id": req.body.requestData.id ? req.body.requestData.id : null
    }

    // parameter to be passed
    params = [1, deal.id, 0];

    var query = "update deals set isDeleted = ? where id = ? and isDeleted = ?";

    db.query(query, params, function (errorDeleteDeal, resultsDeleteDeal) {
        if (!errorDeleteDeal) {
            if (resultsDeleteDeal.affectedRows == 1) {
                logger.info("Deal deleted successfully");
                res.send(responseGenerator.getResponse(200, "Deal deleted successfully", deal));
            }
            else {
                logger.info("deleteDeal - Invalid deal id - " + req.result.userId);
                res.send(responseGenerator.getResponse(1085, "Invalid deal id", null));
            }
        }
        else {
            logger.error("deleteDeal - Error while processing your request", errorDeleteDeal);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorDeleteDeal))
        }
    });
}
