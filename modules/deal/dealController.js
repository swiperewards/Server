var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


exports.getDeals = function (req, res) {

    var deal = {
        'location': req.body.requestData.location
    }
    // parameter to be passed to select deals query
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
                res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
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
                        res.send(responseGenerator.getResponse(200, "Success", { "dealsCount": results[0][0].dealsCount, "deals": results[1] }))
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

        res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))

    }

}
