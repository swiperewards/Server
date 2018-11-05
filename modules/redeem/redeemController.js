var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))
var notifController = require(path.resolve('.', 'modules/notifications/notificationsController.js'));
var emailHandler = require(path.resolve('./', 'utils/emailHandler.js'));
var template = require(path.resolve('./', 'utils/emailTemplates.js'));


exports.getRedeemOptions = function (req, res) {

    // parameters to be passed to select redeem options
    params = [0, 1, 0, '']
    db.query("select mrd.id as modeId, mrd.mode, mrd.status, mrdo.id as modeSubId, mrdo.name from mst_redeem_modes mrd left outer join mst_redeem_mode_options mrdo on mrd.id = mrdo.redeemModeId where mrd.isDeleted = ? and mrd.status = ? and (mrdo.isDeleted = ? or COALESCE(mrdo.isDeleted, '') = ?)", params, function (error, results) {
        if (!error) {
            // code to format the response into required structure, we will get the formated output in arrFinal
            var arr = [];
            for (var i = 0; i < results.length; i++) {
                var obj = {};
                obj.modeId = results[i].modeId;
                obj.mode = results[i].mode;
                obj.status = results[i].status;
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

            // add serial number
            var redeemModes = [];
            for (var i = 0; i < arrFinal.length; i++) {
                var obj = arrFinal[i];
                obj.serial_number = i + 1;
                redeemModes.push(obj);
            }


            logger.info("getRedeemOptions - Redeem options fetched successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Success", redeemModes))
        } else {
            logger.error("getRedeemOptions - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })


}



exports.getRedeemOptionsDetails = function (req, res) {

    // parameters to be passed to select redeem options
    params = [0, 0, '', req.body.requestData.id];
    db.query("select mrd.id as modeId, mrd.mode, mrd.status, mrdo.id as modeSubId, mrdo.name from mst_redeem_modes mrd left outer join mst_redeem_mode_options mrdo on mrd.id = mrdo.redeemModeId where mrd.isDeleted = ? and (mrdo.isDeleted = ? or COALESCE(mrdo.isDeleted, '') = ?) and mrd.id = ?", params, function (error, results) {
        if (!error) {
            // code to format the response into required structure, we will get the formated output in arrFinal
            var arr = [];
            for (var i = 0; i < results.length; i++) {
                var obj = {};
                obj.modeId = results[i].modeId;
                obj.mode = results[i].mode;
                obj.status = results[i].status;
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
            res.send(responseGenerator.getResponse(200, "Success", arrFinal[0]))
        } else {
            logger.error("getRedeemOptions - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}




exports.deleteRedeemMode = function (req, res) {

    // parameters to be passed to select redeem options
    params = [1, 1, req.body.requestData.id];
    db.query("update mst_redeem_modes mrd left outer join mst_redeem_mode_options mrdo on mrd.id = mrdo.redeemModeId set mrd.isDeleted = ?, mrdo.isDeleted = ? where mrd.id = ?", params, function (error, results) {
        if (!error) {
            logger.info("deleteRedeemMode - Redeem mode deleted successfully for user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Redeem mode deleted successfully", null))
        } else {
            logger.error("deleteRedeemMode - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}



exports.updateRedeemMode = function (req, res) {
    // parameters to be passed to select redeem options
    params = [req.body.requestData.id];
    db.query("delete from mst_redeem_mode_options where redeemModeId = ?", params, function (errorDelete, resultsDelete) {
        if (!errorDelete) {
            // parameters to be passed to select redeem options
            params = [req.body.requestData.mode, req.body.requestData.status, new Date(Date.now()), req.body.requestData.id];
            db.query("update mst_redeem_modes set mode = ?, status = ?, modifiedDate = ? where id = ?", params, function (error, results) {
                if (!error) {
                    redeemMode = req.body.requestData;
                    if (redeemMode.options.length > 0) {
                        var params = [];
                        var query = "insert into mst_redeem_mode_options (redeemModeId, name) values";
                        for (var i = 0; i < redeemMode.options.length; i++) {
                            if (i == redeemMode.options.length - 1) {
                                query = query + " (?, ?)";
                                params.push(req.body.requestData.id);
                                params.push(redeemMode.options[i]);
                            }
                            else {
                                query = query + " (?, ?),";
                                params.push(req.body.requestData.id);
                                params.push(redeemMode.options[i]);
                            }
                        }
                        db.query(query, params, function (errorAddOptions, resultsAddOptions) {
                            if (!errorAddOptions) {
                                logger.info("Mode updated successfully - " + req.body.requestData.id);
                                res.send(responseGenerator.getResponse(200, "Redeem mode updated successfully", null))
                            } else {
                                logger.error("Error while processing your request", errorAddOptions);
                                res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                            }
                        })
                    }
                    else {
                        logger.info("Mode updated successfully - " + req.body.requestData.id);
                        res.send(responseGenerator.getResponse(200, "Redeem mode updated successfully", null))
                    }
                } else {
                    logger.error("deleteRedeemMode - Error while processing your request", error);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                }
            })
        } else {
            logger.error("updateRedeemMode - Error while processing your request", errorDelete);
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
            var message;
            template.redeemReqAck(results[0][0].p_userName, function (err, msg) {
                message = msg;
            })
            emailHandler.sendEmail(results[0][0].p_emailId, '"Redeem" Request Acknowledgement', message, function (errorEmailHandler) {
                if (errorEmailHandler) {
                    logger.warn("Failed to send Redeem Request Acknowledgement to linked mail");
                    res.send(responseGenerator.getResponse(1001, "Failed to send Redeem Request Acknowledgement to linked mail", null))
                } else {
                    logger.info("Redeem Request Acknowledgement sent");

                    logger.error("raiseRedeemRequest - redeem request generated successfully by -" + redeemRequest.userId);
                    res.send(responseGenerator.getResponse(200, "Redeem request generated successfully", results[0][0]))
                }
            });

        }
        else {
            logger.error("raiseRedeemRequest - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}



exports.getRedeemRequests = function (req, res) {

    filterStrings = {
        name: req.body.requestData.name ? "%" + req.body.requestData.name + "%" : "%%",
        status: req.body.requestData.status ? "%" + req.body.requestData.status + "%" : "%%",
        amount: req.body.requestData.amount ? "%" + req.body.requestData.amount + "%" : "%%",
        mode: req.body.requestData.mode ? "%" + req.body.requestData.mode + "%" : "%%",
        fromDate: req.body.requestData.fromDate ? req.body.requestData.fromDate : "",
        toDate: req.body.requestData.toDate ? req.body.requestData.toDate : ""
    }

    // parameters to be passed to select redeem requests
    params = [filterStrings.name, filterStrings.status, filterStrings.amount,
    filterStrings.mode, filterStrings.fromDate, filterStrings.toDate]
    db.query("call GetRedeemRequests(?,?,?,?,?,?)", params, function (error, results) {
        if (!error) {
            logger.info("getRedeemRequests - Redeem requests fetched successfully for user - " + req.result.userId);
            var redeemRequests = [];
            for (var i = 0; i < results[0].length; i++) {
                var obj = results[0][i];
                obj.serial_number = i + 1;
                redeemRequests.push(obj);
            }
            var data = {};
            data.redeemRequests = redeemRequests;
            db.query("select status, count(id) as count from redeem_requests group by status", function (errorGetCounts, resultsGetCounts) {
                if (!errorGetCounts) {
                    if (resultsGetCounts.length > 0) {
                        data.summary = {};
                        for (var i = 0; i < resultsGetCounts.length; i++) {
                            if (resultsGetCounts[i].status == 1) {
                                data.summary.pending = resultsGetCounts[i].count;
                            }
                            else if (resultsGetCounts[i].status == 2) {
                                data.summary.approved = resultsGetCounts[i].count;
                            }
                            else {
                                data.summary.rejected = resultsGetCounts[i].count;
                            }
                        }
                    }
                    else {
                        data.summary = { "pending": 0, "approved": 0, "rejected": 0 };
                    }
                    res.send(responseGenerator.getResponse(200, "Success", data));
                } else {
                    logger.error("getRedeemRequests - Error while processing your request", error);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                }
            })

        } else {
            logger.error("getRedeemRequests - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}



exports.getRedeemReqDetails = function (req, res) {

    var redeemRequest = {
        "id": req.body.requestData.id
    }

    // parameter to be passed
    params = [redeemRequest.id, 0];

    var query = "select r.id, r.redeemModeId, mrm.mode, r.redeemModeOptionId, r.userId, u.fullName, r.amount, r.status, " +
        "r.modifiedDate, r.details, r.extraField, r.transactionNumber from redeem_requests r join users u on r.userId = u.userId join mst_redeem_modes mrm on r.redeemModeId = mrm.id where r.id " +
        "= ? and r.isDeleted = ?";

    db.query(query, params, function (errorRedeemReqDetails, resultsRedeemReqDetails) {
        if (!errorRedeemReqDetails) {
            if (resultsRedeemReqDetails.length == 1) {
                logger.info("RedeemReq Details details fetched successfully");
                res.send(responseGenerator.getResponse(200, "Success", resultsRedeemReqDetails[0]));
            }
            else {
                logger.info("getRedeemReqDetails - Invalid id - " + redeemRequest.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
        }
        else {
            logger.error("getRedeemReqDetails - Error while processing your request", errorRedeemReqDetails);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorRedeemReqDetails))
        }
    });
}

// not used
//need to update this api after wallet balance check, max limit
exports.updateRedeemRequest = function (req, res) {

    var redeemRequest = {
        "id": req.body.requestData.id,
        "redeemModeId": req.body.requestData.redeemModeId ? req.body.requestData.redeemModeId : null,
        "redeemModeOptionId": req.body.requestData.redeemModeOptionId ? req.body.requestData.redeemModeOptionId : null,
        "amount": req.body.requestData.amount ? req.body.requestData.amount : null,
        "details": req.body.requestData.details ? req.body.requestData.details : null,
        "extraField": req.body.requestData.extraField ? req.body.requestData.extraField : null
    }
    // parameters to be passed to RaiseRedeemRequest procedure
    params = [redeemRequest.redeemModeId, redeemRequest.redeemModeOptionId, redeemRequest.amount, redeemRequest.details, redeemRequest.extraField, new Date(Date.now()), redeemRequest.id]
    var query = "update redeem_requests set redeemModeId = ?, redeemModeOptionId = ?, amount = ?, details = ?, extraField = ?, modifiedDate = ? where id = ?"
    db.query(query, params, function (error, results) {
        if (!error) {
            if (results.affectedRows == 0) {
                logger.info("updateRedeemRequest - Invalid id - " + redeemRequest.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
            else {
                logger.error("updateRedeemRequest - redeem request updated successfully by -" + req.result.userId);
                res.send(responseGenerator.getResponse(200, "Redeem request updated successfully", null))
            }

        }
        else {
            logger.error("updateRedeemRequest - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    });

}

exports.approveRedeemRequest = function (req, res) {

    var redeemRequest = {
        "id": req.body.requestData.id,
        "amount": req.body.requestData.amount ? req.body.requestData.amount : null,
        "note": req.body.requestData.note ? req.body.requestData.note : null,
        "redeemModeId": req.body.requestData.redeemModeId ? req.body.requestData.redeemModeId : null
    }
    // parameters to be passed to RaiseRedeemRequest procedure
    params = [redeemRequest.id, redeemRequest.amount, redeemRequest.note, redeemRequest.redeemModeId]
    var query = "call ApproveRedeemRequest(?,?,?,?)"
    db.query(query, params, function (error, results) {
        if (!error) {
            if (results[0][0].insufficientBalance) {
                logger.info("approveRedeemRequest - insufficient balance - " + redeemRequest.id);
                res.send(responseGenerator.getResponse(1097, "Insufficient balance", null));
            }
            else {
                notifController.sendNotifRedeemReqStatusChanged(redeemRequest.id, "Approved", function () {
                    var message;
                    template.redeemReqApproved(results[0][0].p_userName, function (err, msg) {
                        message = msg;
                    })
                    emailHandler.sendEmail(results[0][0].p_emailId, 'Redeem Request Status Changed (Approved)', message, function (errorEmailHandler) {
                        if (errorEmailHandler) {
                            logger.warn("Failed to send Redeem Request Status Changed (Approved) to linked mail");
                        } else {
                            logger.info("Redeem Request Status Changed (Approved) Acknowledgement sent");
                        }
                    });
                });
                logger.error("approveRedeemRequest - redeem request approved successfully by -" + req.result.userId);
                res.send(responseGenerator.getResponse(200, "Redeem request approved successfully", null))
            }
        }
        else {
            logger.error("updateRedeemRequest - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    });

}

exports.rejectRedeemRequest = function (req, res) {

    var redeemRequest = {
        "id": req.body.requestData.id,
        "note": req.body.requestData.note ? req.body.requestData.note : null
    }
    // parameters to be passed to RaiseRedeemRequest procedure
    params = [redeemRequest.id, redeemRequest.note]
    var query = "call RejectRedeemRequest(?,?)"
    db.query(query, params, function (error, results) {
        if (!error) {
            if (results[0][0].invalidId) {
                logger.info("rejectRedeemRequest - Invalid id - " + redeemRequest.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
            else {
                notifController.sendNotifRedeemReqStatusChanged(redeemRequest.id, "Rejected", function () {
                    var message;
                    template.redeemReqRejected(results[0][0].fullName, function (err, msg) {
                        message = msg;
                    })
                    emailHandler.sendEmail(results[0][0].emailId, 'Redeem Request Status Changed (Rejected)', message, function (errorEmailHandler) {
                        if (errorEmailHandler) {
                            logger.warn("Failed to send Redeem Request Status Changed (Rejected) to linked mail");
                        } else {
                            logger.info("Redeem Request Status Changed (Rejected) Acknowledgement sent");
                        }
                    });
                });
                logger.error("rejectRedeemRequest - redeem request rejected successfully by -" + req.result.userId);
                res.send(responseGenerator.getResponse(200, "Redeem request rejected successfully", null))
            }

        }
        else {
            logger.error("rejectRedeemRequest - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error))
        }
    });

}

exports.createRedeemMode = function (req, res) {

    var redeemMode = {
        'mode': req.body.requestData.mode,
        'options': req.body.requestData.options
    }
    // parameters to be passed to AddCard procedure
    var params = [redeemMode.mode]
    db.query("call CreateRedeemMode(?)", params, function (error, results) {
        if (!error) {
            if (results[0][0].IsRecordExists) {
                logger.info("Mode already exists - " + results[0][0].id);
                res.send(responseGenerator.getResponse(1051, "Mode already exists", {
                    cardId: results[0][0].id
                }))
            }
            else {
                if (redeemMode.options.length > 0) {
                    var params = [];
                    var query = "insert into mst_redeem_mode_options (redeemModeId, name) values";
                    for (var i = 0; i < redeemMode.options.length; i++) {
                        if (i == redeemMode.options.length - 1) {
                            query = query + " (?, ?)";
                            params.push(results[0][0].id);
                            params.push(redeemMode.options[i]);
                        }
                        else {
                            query = query + " (?, ?),";
                            params.push(results[0][0].id);
                            params.push(redeemMode.options[i]);
                        }
                    }
                    db.query(query, params, function (errorAddOptions, resultsAddOptions) {
                        if (!errorAddOptions) {
                            logger.info("Mode added successfully - " + results[0][0].id);
                            res.send(responseGenerator.getResponse(200, "Mode added successfully", {
                                modeId: results[0][0].id,
                                createdDate: results[0][0].createdDate
                            }))
                        } else {
                            logger.error("Error while processing your request", errorAddOptions);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                        }
                    })
                }
                else {
                    logger.info("Mode added successfully - " + results[0][0].id);
                    res.send(responseGenerator.getResponse(200, "Mode added successfully", {
                        modeId: results[0][0].id,
                        createdDate: results[0][0].createdDate
                    }))
                }
            }

        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })

}