var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


exports.getRedeemOptions = function (req, res) {

    // parameters to be passed to select redeem options
    params = [0, 0, '']
    db.query("select mrd.id as modeId, mrd.mode, mrdo.id as modeSubId, mrdo.name from mst_redeem_modes mrd left outer join mst_redeem_mode_options mrdo on mrd.id = mrdo.redeemModeId where mrd.isDeleted = ? and (mrdo.isDeleted = ? or COALESCE(mrdo.isDeleted, '') = ?)", params, function (error, results) {
        if (!error) {
            // code to format the response into required structure, we will get the formated output in arrFinal
            var arr = [];
            for (var i = 0; i < results.length; i++) {
                var obj = {};
                obj.modeId = results[i].modeId;
                obj.mode = results[i].mode;
                obj.modeOptions = [];
                for (var j = 0; j < results.length; j++) {
                    if ((results[i].modeId == results[j].modeId) && (results[j].modeSubId)) {
                        obj.modeOptions.push({ "modeSubId": results[j].modeSubId, "name": results[j].name });
                    }
                }
                arr.push(obj);
            }
            var arrFinal = [];
            for (var k = 0; k < arr.length; k++) {
                if (k == 0) {
                    arrFinal.push(arr[k]);
                } else {
                    var found = false;
                    for (var l = 0; l < arrFinal.length; l++) {
                        if (arr[k].modeId == arrFinal[l].modeId) {
                            found = true;
                            break;
                        }
                        else {
                        }
                    }
                    if (!found) {
                        arrFinal.push(arr[k]);
                    }
                }
            }


            logger.info("getRedeemOptions - Redeem options fetched successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", arrFinal))
        } else {
            logger.error("getRedeemOptions - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })


}



//need to update this api after wallet balance check, max limit
exports.raiseRedeemRequest = function (req, res) {

    var redeemRequest = {
        "redeemModeId": req.body.requestData.redeemModeId,
        "redeemModeOptionId": req.body.requestData.redeemModeOptionId,
        "userId": req.result.userId,
        "amount": req.body.requestData.amount,
        "details": req.body.requestData.details,
        "extraField": req.body.requestData.extraField ? req.body.requestData.extraField : null
    }
    // parameters to be passed to RaiseRedeemRequest procedure
    params = [redeemRequest.redeemModeId, redeemRequest.redeemModeOptionId, redeemRequest.userId, redeemRequest.amount, redeemRequest.details, redeemRequest.extraField]
    db.query('call RaiseRedeemRequest(?,?,?,?,?,?)', params, function (error, results) {
        if (!error) {
            logger.error("raiseRedeemRequest - redeem request generated successfully by -" + redeemRequest.userId);
            res.send(responseGenerator.getResponse(200, "Redeem request generated successfully", results[0][0]))
        }
        else {
            logger.error("raiseRedeemRequest - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}



exports.getRedeemRequests = function (req, res) {

    filterStrings = {
        name: req.body.requestData.nameFilter ? "%" + req.body.requestData.nameFilter + "%" : "%%",
        status: req.body.requestData.statusFilter ? "%" + req.body.requestData.statusFilter + "%" : "%%",
        amount: req.body.requestData.amountFilter ? "%" + req.body.requestData.amountFilter + "%" : "%%",
        mode: req.body.requestData.modeFilter ? "%" + req.body.requestData.modeFilter + "%" : "%%",
        fromDate: req.body.requestData.fromDateFilter ? "%" + req.body.requestData.fromDateFilter + "%" : "%%",
        toDate: req.body.requestData.toDateFilter ? "%" + req.body.requestData.toDateFilter + "%" : "%%"
    }

    // parameters to be passed to select redeem requests
    params = [0]
    db.query("select r.id, u.fullName, u.emailId, r.amount, mr.mode, r.status from redeem_requests r left join users u on r.userId = u.userId left join mst_redeem_modes mr on r.redeemModeId = mr.id where r.isDeleted = ?", params, function (error, results) {
        if (!error) {
            logger.info("getRedeemRequests - Redeem requests fetched successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", results))
        } else {
            logger.error("getRedeemRequests - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}

