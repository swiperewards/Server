var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var transaction = require(path.resolve('.', 'modules/transaction/transactionController.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));
var each = require('sync-each');


exports.createMerchant = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.createMerchant(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while creating merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchant added successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}

exports.getMerchants = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.getMerchants(function (error, response) {
        if (error) {
            logger.info("Error while fetching merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchants fetched successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}


exports.getMerchantsWithFilter = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.getMerchantsWithFilter(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while fetching merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchants fetched successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}

exports.getMerchantDetails = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.getMerchantDetails(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while fetching merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchant details fetched successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}


exports.deleteMerchant = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.deleteMerchant(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while deleting merchant - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchant deleted successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}


exports.updateMerchant = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.updateMerchant(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while deleting merchant - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchant updated successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}


exports.updateMerchantDetails = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    var data = [];
    var obj = {};
    transaction.updateMerchant({ "requestData": Reqbody.requestData.merchantData }, function (errorUpdateMerchant, responseUpdateMerchant) {
        if (errorUpdateMerchant) {
            logger.info("Error while updating merchant - " + req.result.userId);
            obj = {};
            obj.code = "500";
            obj.description = "Error while updating merchant";
            obj.data = errorUpdateMerchant;
            data.push(obj);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", errorUpdateMerchant));
        }
        else if (responseUpdateMerchant) {
            logger.info("Merchant updated successfully by user - " + req.result.userId);
            obj = {};
            obj.code = responseUpdateMerchant.body.status;
            obj.description = responseUpdateMerchant.body.message;
            (responseUpdateMerchant.body.status == 200) ? (obj.data = null) : (obj.data = responseUpdateMerchant.body.responseData);
            data.push(obj);
        }

        transaction.updateEntity({ "requestData": Reqbody.requestData.entityData }, function (errorUpdateEntity, responseUpdateEntity) {
            if (errorUpdateEntity) {
                logger.info("Error while updating entity - " + req.result.userId);
                obj = {};
                obj.code = "500";
                obj.description = "Error while updating entity";
                obj.data = errorUpdateEntity;
                data.push(obj);
                // res.send(responseGenerator.getResponse(200, "Error while fetching merchants", errorUpdateEntity));
            }
            else if (responseUpdateEntity) {
                logger.info("Entity updated successfully by user - " + req.result.userId);
                obj = {};
                obj.code = responseUpdateEntity.body.status;
                obj.description = responseUpdateEntity.body.message;
                (responseUpdateEntity.body.status == 200) ? (obj.data = null) : (obj.data = responseUpdateEntity.body.responseData);
                data.push(obj);
            }
            each(Reqbody.requestData.memberData,
                function (member, next) {
                    //perform async operation with item
                    if(member.isNewRecord){
                        transaction.createMember({ "requestData": member }, function (errorCreateMember, responseCreateMember) {
                            if (errorCreateMember) {
                                logger.info("Error while updating member - " + req.result.userId);
                                obj = {};
                                obj.code = "500";
                                obj.description = "Error while updating member";
                                obj.data = errorCreateMember;
                                data.push(obj);
                                // res.send(responseGenerator.getResponse(200, "Error while fetching merchants", errorUpdateEntity));
                            }
                            else if (responseCreateMember) {
                                logger.info("Member created successfully by user - " + req.result.userId);
                                obj = {};
                                obj.code = responseCreateMember.body.status;
                                obj.description = responseCreateMember.body.message;
                                (responseCreateMember.body.status == 200) ? (obj.data = null) : (obj.data = responseCreateMember.body.responseData);
                                data.push(obj);
                            }
                            next();
                        });
                    }
                    else {
                        transaction.updateMember({ "requestData": member }, function (errorUpdateMember, responseUpdateMember) {
                            if (errorUpdateMember) {
                                logger.info("Error while updating member - " + req.result.userId);
                                obj = {};
                                obj.code = "500";
                                obj.description = "Error while updating member";
                                obj.data = errorUpdateMember;
                                data.push(obj);
                                // res.send(responseGenerator.getResponse(200, "Error while fetching merchants", errorUpdateEntity));
                            }
                            else if (responseUpdateMember) {
                                logger.info("Member updated successfully by user - " + req.result.userId);
                                obj = {};
                                obj.code = responseUpdateMember.body.status;
                                obj.description = responseUpdateMember.body.message;
                                (responseUpdateMember.body.status == 200) ? (obj.data = null) : (obj.data = responseUpdateMember.body.responseData);
                                data.push(obj);
                            }
                            next();
                        });
                    }

                },
                function () {
                    //Success callback
                    transaction.updateAccount({ "requestData": Reqbody.requestData.accountData }, function (errorUpdateAccount, responseUpdateAccount) {
                        if (errorUpdateAccount) {
                            logger.info("Error while updating account - " + req.result.userId);
                            obj = {};
                            obj.code = "500";
                            obj.description = "Error while updating account";
                            obj.data = errorUpdateAccount;
                            data.push(obj);
                            // res.send(responseGenerator.getResponse(200, "Error while fetching merchants", errorUpdateEntity));
                        }
                        else if (responseUpdateAccount) {
                            logger.info("Account updated successfully by user - " + req.result.userId);
                            obj = {};
                            obj.code = responseUpdateAccount.body.status;
                            obj.description = responseUpdateAccount.body.message;
                            (responseUpdateAccount.body.status == 200) ? (obj.data = null) : (obj.data = responseUpdateAccount.body.responseData);
                            data.push(obj);
                        }
                        res.send(responseGenerator.getResponse(200, "Success",data));
                    });
                }
            )
        });
    });
}