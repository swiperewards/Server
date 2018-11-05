var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))
var each = require('sync-each');


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
                params = [deals.merchantName, deals.status, deals.location, deals.fromDate, deals.toDate, deals.pageNumber, deals.pageSize, result.userId]
                db.query('call GetDealsWeb(?,?,?,?,?,?,?,?)', params, function (error, results) {
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
    db.query("select md.merchantId, md.entityName, d.id, d.shortDescription, d.longDescription, d.startDate, d.endDate, d.cashBonus, d.status, d.location, d.storeLocation, d.latitude, d.longitude from deals d inner join merchantdata md on d.merchantId = md.merchantId where d.isDeleted = ? and d.id = ?", params, function (error, results) {
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
    var poolToRollOver = 0;
    var previousDealId = 0;
    params = [];
    db.query('select * from deals where merchantId = ? and status = ? and isPoolDistributed = ?', [req.body.requestData.merchantId, 1, 1], function (errorGetOldDeal, resultsGetOldDeal) {
        if (!errorGetOldDeal) {
            if (resultsGetOldDeal.length > 0) {
                poolToRollOver = parseFloat(resultsGetOldDeal[0].remainingPoolAmount) / 100;
                previousDealId = resultsGetOldDeal[0].id;
            }

            params = [req.body.requestData.startDate, req.body.requestData.endDate, req.body.requestData.merchantId, 0, 1]
            db.query('select * from deals where ((? between startDate and endDate) or (? between startDate and endDate)) and merchantId = ? and isDeleted = ? and status = ?', params, function (errorCheckDealExists, resultsCheckDealExists) {
                if (!errorCheckDealExists) {
                    if (resultsCheckDealExists.length > 0) {
                        logger.info("addDeal - Deal already exists for this period ");
                        res.send(responseGenerator.getResponse(1099, "Deal already exists for this period", null))
                    }
                    else {
                        db.query('select tbasis from tbasis where id = ?', [1], function (errorGetBasis, resultsGetBasis) {
                            if (!errorGetBasis) {

                                var deal = {
                                    "merchantId": req.body.requestData.merchantId,
                                    "shortDescription": req.body.requestData.shortDescription ? req.body.requestData.shortDescription : null,
                                    "longDescription": req.body.requestData.longDescription ? req.body.requestData.longDescription : null,
                                    "startDate": req.body.requestData.startDate ? req.body.requestData.startDate : null,
                                    "endDate": req.body.requestData.endDate ? req.body.requestData.endDate : null,
                                    "cashBonus": req.body.requestData.cashBonus ? (parseFloat(req.body.requestData.cashBonus) + poolToRollOver) : null,
                                    "icon": req.body.requestData.icon ? req.body.requestData.icon : null,
                                    "createdBy": req.result.userId,
                                    "location": req.body.requestData.location ? req.body.requestData.location : null,
                                    "latitude": req.body.requestData.latitude ? req.body.requestData.latitude : null,
                                    "longitude": req.body.requestData.longitude ? req.body.requestData.longitude : null,
                                    "status": (req.body.requestData.status == "1") ? "1" : "0",
                                    "storeLocation": req.body.requestData.storeLocation ? req.body.requestData.storeLocation : null,
                                    "tbasis": resultsGetBasis[0].tbasis
                                }
                                // parameter to be passed
                                params = [deal.merchantId, deal.shortDescription, deal.longDescription,
                                deal.startDate, deal.endDate, deal.cashBonus, deal.icon, deal.createdBy, deal.location,
                                deal.latitude, deal.longitude, deal.status, deal.storeLocation, deal.tbasis, previousDealId]
                                db.query('call addDeal(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results) {
                                    if (!error) {
                                        logger.info("addDeal - Deal added successfully -" + deal.userId);
                                        res.send(responseGenerator.getResponse(200, "Deal added successfully", results[0][0]))
                                    }
                                    else {
                                        logger.error("Error while processing your request", error);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                    }
                                });
                            }
                            else {
                                logger.error("Error while processing your request", error);
                                res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                            }
                        });
                    }
                }
                else {
                    logger.error("Error while processing your request", errorCheckDealExists);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                }
            });
        }
        else {
            logger.error("Error while processing your request", errorCheckDealExists);
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
        "status": (req.body.requestData.status == "1") ? "1" : "0",
        "storeLocation": req.body.requestData.storeLocation ? req.body.requestData.storeLocation : null
    }

    params = [req.body.requestData.startDate, req.body.requestData.endDate, req.body.requestData.merchantId, 0, 1, deal.id]
    db.query('select * from deals where ((? between startDate and endDate) or (? between startDate and endDate)) and merchantId = ? and isDeleted = ? and status = ? and id != ?', params, function (errorCheckDealExists, resultsCheckDealExists) {
        if (!errorCheckDealExists) {
            if (resultsCheckDealExists.length > 0) {
                logger.info("addDeal - Deal already exists for this period ");
                res.send(responseGenerator.getResponse(1099, "Deal already exists for this period", null))
            }
            else {
                // parameter to be passed
                params = [deal.shortDescription, deal.longDescription,
                deal.startDate, deal.endDate, deal.cashBonus, deal.icon, deal.location,
                deal.latitude, deal.longitude, new Date(Date.now()), deal.status, deal.storeLocation, deal.id, 0];

                var query = "update deals set shortDescription = ?, longDescription = ?, " +
                    "startDate = ?, endDate = ?, cashBonus = ?, icon = ?, location = ?, latitude = ?, longitude = ?, " +
                    "modifiedDate = ?, status = ?, storeLocation = ? where id = ? and isDeleted = ?";

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
                        res.send(responseGenerator.getResponse(1005, msg.dbError, errorUpdateDeal));
                    }
                });
            }
        }
        else {
            logger.error("Error while processing your request", errorCheckDealExists);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
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





/**
 * This api function is used to get the active deals with their merchant id, deal_id, start and end date.
 * This function will get called from Nouvo transaction server 2.
 */
exports.getActiveDeals = function (req, res) {
    var query = 'select deals.id, merchantdata.merchantId,deals.startDate, deals.endDate from deals ' +
        'inner join merchantdata on deals.merchantId=merchantdata.merchantId ' +
        'where status =1 and now()>=startDate and now() <=endDate';

    db.query(query, function (error, results) {
        if (!error) {
            res.send(responseGenerator.getResponse(200, "Success", results))
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


/**
 * This api function is used to update the below parameters in deal table.
 * 1) Total transactions amount of nouvo users
 * 2) Total transactoins of non nouvo users. 
 * 3) Calcuate the pool amount of the deal.
 * @param {*} req 
 * @param {*} res 
 */
exports.updatePoolAmounts = function (req, res) {
    var totalSwipeAmount;
    var params;
    // saveTransactionToDatabase(res,splashResponse.body.data)
    if (req.body != null) {

        db.beginTransaction(function (err) {
            if (err) {
                throw err;
            }
            console.log('Total pool updates received ' + req.body.length);
            var arr = [];
            //arr.push();
            if (req.body.length > 0) {
                each(req.body,
                    function (poolDetail, next) {
                        arr.push(poolDetail);
                        if (poolDetail.registeredUserSwipeAmt != null && poolDetail.nonRegisteredUserSwipeAmt != null && poolDetail.deal_id != null) {
                            totalSwipeAmount = poolDetail.registeredUserSwipeAmt + poolDetail.nonRegisteredUserSwipeAmt;
                            params = [poolDetail.registeredUserSwipeAmt, poolDetail.nonRegisteredUserSwipeAmt,
                                totalSwipeAmount, poolDetail.deal_id];

                            //Updating pool amount using query and forumla
                            //Pool Amount compounding = Tbase + ((Tbasis/100)*(Transactions/100)) 
                            //Below, d.cahBonus is merchant contribution

                            var query = 'select * from deals where id=?';

                            db.query(query, [poolDetail.deal_id], function (errGetDeal, resultGetDeal) {
                                if (errGetDeal) {
                                    console.log('Callback Transaction Error.' + err);
                                    db.rollback(function () {
                                        console.log('Rollbacking Transactions.' + err);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                    });
                                }
                                else {
                                    if (resultGetDeal.length > 0) {
                                        var oldPool = resultGetDeal[0].totalPoolAmount;
                                        var totalPool = (parseFloat(resultGetDeal[0].cashBonus) * 100) + ((parseFloat(resultGetDeal[0].tBasis) / 100) * (totalSwipeAmount / 100));
                                        var increaseInPool = totalPool - oldPool;
                                        var updateQuery = 'update deals d set d.registeredUserSwipeAmt=?, d.nonRegisteredUserSwipeAmt=?, d.increasedPool = "'+increaseInPool+
                                            '", d.totalPoolAmount=(d.cashBonus * 100) + (d.tBasis/100) * ((?)/100) where d.id=?';

                                        db.query(updateQuery, params, function (err, result) {
                                            if (err) {
                                                console.log('Callback Transaction Error.' + err);
                                                db.rollback(function () {
                                                    console.log('Rollbacking Transactions.' + err);
                                                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                                });
                                            }
                                            next(err, arr)
                                        });
                                    }
                                    else {
                                        next(err, arr);
                                    }
                                }
                            });
                        }
                    },
                    function (err, transformedItems) {
                        if (!err) {
                            db.commit(function (err) {
                                if (err) {
                                    db.rollback(function () {
                                        console.log('Transaction Error while commiting.' + err);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                    });
                                } else {
                                    console.log('Pool amount update completed at server 1.');
                                    res.send(responseGenerator.getResponse(200, "Success", null))
                                }
                            });

                        }
                    })
            }
            else {
                console.log('No data to update deal pool amount');
                res.send(responseGenerator.getResponse(201, "No data to update deal pool amount", null))
            }
        });
    }
}



/**
 * This api function is used to get the expired deals with their merchant id, deal_id, start and end date.
 * This function will get called from Nouvo transaction server 2.
 */
exports.getExpiredDeals = function (req, res) {
    var today = new Date(Date.now());
    var yesterday = new Date();
    var dayBeforeYesterday = new Date();
    yesterday = (new Date(yesterday.setDate(today.getDate() - 1))).toISOString();
    dayBeforeYesterday = (new Date(dayBeforeYesterday.setDate(today.getDate() - 2))).toISOString();
    var query = 'select d.id, m.merchantId, d.startDate, d.endDate from deals d' +
        ' inner join merchantdata m on d.merchantId=m.merchantId' +
        ' where d.endDate between "' + dayBeforeYesterday + '" and "' + yesterday + '"';

    db.query(query, function (error, results) {
        if (!error) {
            res.send(responseGenerator.getResponse(200, "Success", results))
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}




/**
 * This api function is used to update the below parameters in deal table.
 * 1) Total transactions amount of nouvo users
 * 2) Total transactoins of non nouvo users. 
 * 3) Calcuate the pool amount of the deal.
 * @param {*} req 
 * @param {*} res 
 */
exports.distributeRewards = function (req, res) {
    // saveTransactionToDatabase(res,splashResponse.body.data)
    if (req.body != null) {

        db.beginTransaction(function (errBeginTxn) {
            if (errBeginTxn) {
                throw errBeginTxn;
            }
            console.log('Total deals rewards to be distributed ' + req.body.length);
            var arr = [];
            //arr.push();
            if (req.body.length > 0) {
                each(req.body,
                    function (deal, next) {
                        if (deal.stake.length == 0) {
                            next(err);
                        }
                        else {
                            each(deal.stake,
                                function (userStake, nextUserStake) {
                                    query = 'call DistributeRewards(?,?,?,?,?)';
                                    params = [deal.merchantId, userStake.userId, userStake.stake, deal.endDate, deal.id];
                                    db.query(query, params, function (errorRewardDistribute, resultsRewardDistribute) {
                                        nextUserStake(errorRewardDistribute);
                                    })
                                },
                                function (errorRewardDistribute) {
                                    if (!errorRewardDistribute) {
                                        // next(err);
                                        query = 'update deals set isPoolDistributed = ? where id = ?';
                                        params = [true, deal.id];
                                        db.query(query, params, function (errorUpdateStatus, resultsUpdateStatus) {
                                            if (!errorUpdateStatus) {
                                                // nextUserStake(errorNextUserStake);
                                                next(errorUpdateStatus);
                                            } else {
                                                console.log('Callback Transaction Error.' + errorUpdateStatus);
                                                db.rollback(function () {
                                                    console.log('Rollbacking Transactions.' + errorUpdateStatus);
                                                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                                });
                                            }
                                        })
                                    }

                                });
                        }
                    },
                    function (err) {
                        if (!err) {
                            db.commit(function (err) {
                                if (err) {
                                    db.rollback(function () {
                                        console.log('Transaction Error while commiting.' + err);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                    });
                                } else {
                                    console.log('Reward distribution completed at server 1.');
                                    res.send(responseGenerator.getResponse(200, "Success", null))
                                }
                            });

                        }
                        else {
                            console.log('Something went wrong - distribute rewards');
                            res.send(responseGenerator.getResponse(201, "Something went wrong - distribute rewards", err))
                        }
                    })
            }
            else {
                console.log('No data to distribute rewards');
                res.send(responseGenerator.getResponse(201, "No data to distribute rewards", null))
            }
        });
    }
    else {
        console.log('No data to distribute rewards');
        res.send(responseGenerator.getResponse(201, "No data to distribute rewards", null))
    }
}
