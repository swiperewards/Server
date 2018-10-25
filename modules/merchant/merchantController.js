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
var randomstring = require("randomstring");
var emailHandler = require(path.resolve('./', 'utils/emailHandler.js'));
var template = require(path.resolve('./', 'utils/emailTemplates.js'));
var functions = require(path.resolve('./', 'utils/functions.js'));

// npm required for the s3 storage
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');

aws.config.update({
    secretAccessKey: config.s3SecreateAccessKey,
    accessKeyId: config.s3accessKeyId,
    region: config.region

});
// S3 variable declarations
var s3 = new aws.S3();


exports.createMerchant = function (req, res) {
    var Reqbody = req.body;
    // var registeredWithNouvo = req.body.requestData.registeredWithNouvo;
    var registeredEmail = req.body.requestData.registeredEmail;
    // if (registeredWithNouvo) {

    // if (registeredEmail == Reqbody.requestData.entityEmail) {
    Reqbody.userId = req.result.userId;

    transaction.createMerchant(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while creating merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(1081, msg.splashError, error));
        }
        else if (response) {
            if (response.body.status == 200) {
                logger.info("Merchant added successfully by user - " + req.result.userId);
                decryptedResponse = functions.decryptData(response.body.responseData);
                decryptedRequest = functions.decryptData(req.body.requestData);

                if(decryptedRequest.image) {
                    var ProfilePicUrl = "https://s3.amazonaws.com/" + config.merchantLogoBucketName + "/" + decryptedResponse.merchantId + ".jpg";

                    buf = new Buffer(decryptedRequest.image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
                    var data = {
                        Key: decryptedResponse.merchantId + ".jpg",
                        Body: buf,
                        ContentEncoding: 'base64',
                        ContentType: 'image/jpeg',
                        Bucket: config.merchantLogoBucketName,
                        ACL: 'public-read'
                    };
    
                    s3.putObject(data, function (err, data) {
                        if (err) {
                            console.log(err);
                            console.log('Error uploading data: ', data);
                        } else {
                            var params = [decryptedResponse.fullName, decryptedRequest.registeredEmail, "Web",
                            decryptedResponse.merchantId, decryptedResponse.entityName, decryptedResponse.entityId,
                            decryptedResponse.accountId, decryptedResponse.memberId, ProfilePicUrl];
                            db.query('call UpdateMerchant(?,?,?,?,?,?,?,?,?)', params, function (errorUpdateMerchant, results) {
                                if (!errorUpdateMerchant) {
                                    res.send(response.body);
                                } else {
                                    logger.error("Error while processing your request", errorUpdateMerchant);
                                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                }
                            })
                        }
                    });
                }
                else {

                    var params = [decryptedResponse.fullName, decryptedRequest.registeredEmail, "Web",
                    decryptedResponse.merchantId, decryptedResponse.entityName, decryptedResponse.entityId,
                    decryptedResponse.accountId, decryptedResponse.memberId, ""];
                    db.query('call UpdateMerchant(?,?,?,?,?,?,?,?,?)', params, function (errorUpdateMerchant, results) {
                        if (!errorUpdateMerchant) {
                            res.send(response.body);
                        } else {
                            logger.error("Error while processing your request", errorUpdateMerchant);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                        }
                    })
                }
                
            }
            else {
                logger.info("Create merchant - something went wrong" + req.result.userId);
                res.send(response.body);
            }

        }
    });
    // }
    // else {
    //     logger.warn("Business email must be same as registered email address");
    //     res.send(responseGenerator.getResponse(1093, "Business email must be same as registered email address", null));
    // }
    // }
    // else {
    //     Reqbody.userId = req.result.userId;
    //     var query = {
    //         sql: "select userId, fullName from users where emailId = ?",
    //         values: [Reqbody.requestData.entityEmail]
    //     };

    //     db.query(query, function (errorEmailCheck, resultsEmailCheck, fieldsEmailCheck) {
    //         if (errorEmailCheck) {
    //             logger.error("Error while processing your request", errorEmailCheck);
    //             res.send(responseGenerator.getResponse(1005, msg.dbError, null))
    //         } else {
    //             if (resultsEmailCheck.length == 0) {
    //                 transaction.createMerchant(Reqbody, function (error, response) {
    //                     if (error) {
    //                         logger.info("Error while creating merchants - " + req.result.userId);
    //                         res.send(responseGenerator.getResponse(1081, msg.splashError, error));
    //                     }
    //                     else if (response) {
    //                         if (response.body.status == 200) {
    //                             logger.info("Merchant added successfully by user - " + req.result.userId);
    //                             var randomPassword = randomstring.generate(8);
    //                             var encPass = functions.encrypt(randomPassword);
    //                             var params = [response.body.responseData.fullName, response.body.responseData.email, encPass, "Web",
    //                             response.body.responseData.merchantId, response.body.responseData.entityName, response.body.responseData.entityId, response.body.responseData.accountId, response.body.responseData.memberId];
    //                             db.query('call CreateMerchant(?,?,?,?,?,?,?,?,?)', params, function (error, results) {
    //                                 if (!error) {
    //                                     var token = randomstring.generate(6);

    //                                     query = "insert into account_activation_requests (requestId, emailId) values (?,?)";
    //                                     params = [token, Reqbody.requestData.entityEmail];
    //                                     db.query(query, params, function (errorInsertActivateToken, resultsInsertActivateToken) {
    //                                         if (!errorInsertActivateToken) {
    //                                             var message;
    //                                             template.activateAccount(response.body.responseData.fullName, token, 3, randomPassword, function (err, msg) {
    //                                                 message = msg;
    //                                             })
    //                                             emailHandler.sendEmail(results[0][0].emailId, "Welcome to Nouvo!", message, function (errorEmailHandler) {
    //                                                 if (errorEmailHandler) {
    //                                                     logger.warn("Failed to send Verification link to linked mail");
    //                                                     // res.send(responseGenerator.getResponse(1001, "Merchant created successfully, Failed to send Verification link to linked mail", response.body.responseData))
    //                                                     res.send(response.body);
    //                                                 } else {
    //                                                     logger.info("Verification link sent to mail");
    //                                                     res.send(response.body);
    //                                                 }
    //                                             });
    //                                         } else {
    //                                             logger.error("Error while processing your request", errorInsertActivateToken);
    //                                             res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
    //                                         }
    //                                     })

    //                                 } else {
    //                                     logger.error("Error while processing your request", error);
    //                                     res.send(responseGenerator.getResponse(1005, msg.dbError, null))
    //                                 }
    //                             })
    //                         }
    //                         else {
    //                             logger.info("Create merchant - something went wrong" + req.result.userId);
    //                             res.send(response.body);
    //                         }

    //                     }
    //                 });
    //             }
    //             else {
    //                 logger.warn("Email Already Exists");
    //                 res.send(responseGenerator.getResponse(1004, "Could not able to create new merchant as this mail id is already exists, please use different mail id", null));
    //             }

    //         }
    //     });

    // }


}

exports.getMerchants = function (req, res) {
    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    transaction.getMerchants(function (error, response) {
        if (error) {
            logger.info("Error while fetching merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(1088, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchants fetched successfully by user - " + req.result.userId);
            res.send(response.body);
        }
    });
}


exports.getMerchantsWithFilter = function (req, res) {
    var userId = req.body.requestData.userId;

    var params = [userId, 0];

    var query = "Select merchantId from merchantdata where userId = ? and isDeleted = ?";

    db.query(query, params, function (errorGetMerchants, resultsMerchants) {
        if (!errorGetMerchants) {
            if (resultsMerchants.length > 0) {
                req.body.requestData.merchantsList = resultsMerchants;
                transaction.getMerchantsWithFilter(req.body, function (error, response) {
                    if (error) {
                        logger.info("Error while fetching merchants - " + req.result.userId);
                        res.send(responseGenerator.getResponse(1088, "Error while fetching merchants", error));
                    }
                    else if (response) {
                        logger.info("Merchants fetched successfully by user - " + req.result.userId);
                        res.send(response.body);
                    }
                });
            }
            else {
                logger.info("No business added for merchant - " + userId);
                res.send(responseGenerator.getResponse(200, "Success", []));
            }
        } else {
            logger.error("Error while processing your request", errorGetMerchants);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorGetMerchants));
        }
    })
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
            decryptedRequest = functions.decryptData(req.body.requestData);
            db.query("update merchantdata set inactive = ? where merchantId = ?", [decryptedRequest.inactive, decryptedRequest.merchantId], function (error, results) {
                if (!error) {
                    res.send(response.body);
                }
                else {
                    var Reqbody = req.body;
                    Reqbody.userId = req.result.userId;
                    Reqbody.requestData = functions.decryptData(Reqbody.requestData);
                    Reqbody.requestData.inactive = !Reqbody.requestData.inactive;
                    transaction.deleteMerchant(Reqbody, function (error, response) {
                        logger.info("Error while deleting merchant - " + req.result.userId + " - " + error);
                    })
                    res.send(responseGenerator.getResponse(1083, "Something went wrong", error));
                }
            });

        }
    });
}

//not used

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
    if (req.body.requestData.isLogoUpdated == "1") {
        var logoUrl = "https://s3.amazonaws.com/" + config.merchantLogoBucketName + "/" + req.body.requestData.merchantId + ".jpg";

        buf = new Buffer(req.body.requestData.image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
        var data = {
            Key: req.body.requestData.merchantId + ".jpg",
            Body: buf,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg',
            Bucket: config.merchantLogoBucketName,
            ACL: 'public-read'
        };

        s3.putObject(data, function (err, data) {
            if (err) {
                console.log(err);
                console.log('Error uploading data: ', data);
            } else {
                updateMerchantDetailsFunction(req, res, logoUrl, req.body.requestData.isLogoUpdated);
            }
        });
    }
    else {
        updateMerchantDetailsFunction(req, res, "", "0");
    }
}

function updateMerchantDetailsFunction(req, res, logoUrl, isLogoUpdated) {

    var Reqbody = req.body;
    Reqbody.userId = req.result.userId;
    var data = [];
    var obj = {};
    var merchantInfo = {};

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
            //**change */
            responseUpdateMerchant.body.responseData = functions.decryptData(responseUpdateMerchant.body.responseData);
            (responseUpdateMerchant.body.status == 200) ? (obj.data = responseUpdateMerchant.body.responseData) : (obj.data = responseUpdateMerchant.body.responseData);
            data.push(obj);
            if (responseUpdateMerchant.body.status == 200) {
                merchantInfo.merchantId = responseUpdateMerchant.body.responseData.id;
                merchantInfo.created = responseUpdateMerchant.body.responseData.created;
                merchantInfo.modified = responseUpdateMerchant.body.responseData.modified;
                merchantInfo.creator = responseUpdateMerchant.body.responseData.creator;
                merchantInfo.modifier = responseUpdateMerchant.body.responseData.modifier;
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
                    responseUpdateEntity.body.responseData = functions.decryptData(responseUpdateEntity.body.responseData);
                    logger.info("Entity updated successfully by user - " + req.result.userId);
                    obj = {};
                    obj.code = responseUpdateEntity.body.status;
                    obj.description = responseUpdateEntity.body.message;
                    (responseUpdateEntity.body.status == 200) ? (obj.data = responseUpdateEntity.body.responseData) : (obj.data = responseUpdateEntity.body.responseData);
                    data.push(obj);
                    if (responseUpdateEntity.body.status == 200) {
                        merchantInfo.entityId = responseUpdateEntity.body.responseData.id;
                        merchantInfo.entityName = responseUpdateEntity.body.responseData.name;
                        merchantInfo.email = responseUpdateEntity.body.responseData.email;
                    }
                    each(Reqbody.requestData.memberData,
                        function (member, next) {
                            //perform async operation with item
                            if (member.isNewRecord == "1") {
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
                                        responseCreateMember.body.responseData = functions.decryptData(responseCreateMember.body.responseData);
                                        if (responseCreateMember.body.status == 200) {
                                            if (member.primary == 1) {
                                                merchantInfo.memberId = member.id;
                                                merchantInfo.fullName = member.first + " " + member.last;
                                                merchantInfo.phone = member.phone;
                                                merchantInfo.zip = member.zip;
                                                merchantInfo.city = member.city;
                                            }
                                        }

                                        logger.info("Member created successfully by user - " + req.result.userId);
                                        obj = {};
                                        obj.code = responseCreateMember.body.status;
                                        obj.description = responseCreateMember.body.message;
                                        (responseCreateMember.body.status == 200) ? (obj.data = responseCreateMember.body.responseData) : (obj.data = responseCreateMember.body.responseData);
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
                                        responseUpdateMember.body.responseData = functions.decryptData(responseUpdateMember.body.responseData);
                                        if (responseUpdateMember.body.status == 200) {
                                            if (member.primary == 1) {
                                                merchantInfo.memberId = member.memberId;
                                                merchantInfo.fullName = member.first + " " + member.last;
                                                merchantInfo.phone = member.phone;
                                                merchantInfo.zip = member.zip;
                                                merchantInfo.city = member.city;
                                            }
                                        }

                                        logger.info("Member updated successfully by user - " + req.result.userId);
                                        obj = {};
                                        obj.code = responseUpdateMember.body.status;
                                        obj.description = responseUpdateMember.body.message;
                                        (responseUpdateMember.body.status == 200) ? (obj.data = responseUpdateMember.body.responseData) : (obj.data = responseUpdateMember.body.responseData);
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
                                    responseUpdateAccount.body.responseData = functions.decryptData(responseUpdateAccount.body.responseData);
                                    if (responseUpdateAccount.body.status == 200) {
                                        if (responseUpdateAccount.body.primary == 1) {
                                            merchantInfo.accountId = responseUpdateAccount.body.id;
                                        }
                                    }

                                    logger.info("Account updated successfully by user - " + req.result.userId);
                                    obj = {};
                                    obj.code = responseUpdateAccount.body.status;
                                    obj.description = responseUpdateAccount.body.message;
                                    (responseUpdateAccount.body.status == 200) ? (obj.data = responseUpdateAccount.body.responseData) : (obj.data = responseUpdateAccount.body.responseData);
                                    data.push(obj);
                                    // updateMerchantData(Reqbody.requestData.merchantData.merchantId, merchantInfo, function () {

                                    // })

                                    decryptedRequest = functions.decryptData(req.body.requestData);
                                    query = "update merchantdata set entityName = ? where merchantId = ?";
                                    params = [merchantInfo.entityName];
                                    if(isLogoUpdated == "1"){
                                        query = "update merchantdata set entityName = ?, logoUrl = ? where merchantId = ?";
                                        params.push(logoUrl);
                                    }
                                    params.push(decryptedRequest.merchantData.merchantId);
                                    db.query(query, params, function (error, results) {
                                        res.send(responseGenerator.getResponse(200, "Success", data));
                                    });

                                }
                            });
                        }
                    )
                }
            });
        }
    });
}


// function updateMerchantData(merchant, merchantInfo, callback) {
//     db.query("select userId from merchantdata where merchantId = ?", [merchant], function (errorGetUserId, resultGetUserId) {
//         if (!errorGetUserId && (resultGetUserId.length > 0)) {
//             db.query("select * from users where userId = ?", [resultGetUserId[0].userId], function (errorGetUserData, responseGetUserData) {
//                 if (!errorGetUserData && (responseGetUserData.length > 0)) {
//                     dataToUpdateInUsers = [];
//                     merchantInfo.fullName ? (dataToUpdateInUsers.push(merchantInfo.fullName)) : (dataToUpdateInUsers.push(responseGetUserData[0].fullName))
//                     merchantInfo.emailId ? (dataToUpdateInUsers.push(merchantInfo.emailId)) : (dataToUpdateInUsers.push(responseGetUserData[0].emailId))
//                     dataToUpdateInUsers.push(new Date(Date.now()));
//                     dataToUpdateInUsers.push(resultGetUserId[0].userId);
//                     db.query("update users set fullName = ?, emailId = ?, modifiedDate = ? where userId = ?", dataToUpdateInUsers, function (errorUpdateUserData, responseUpdateUserData) {
//                         if (!errorUpdateUserData) {
//                             db.query("select * from merchantdata where merchantId = ?", [merchant], function (errorGetMerchantData, responseGetMerchantData) {
//                                 if (!errorGetMerchantData && (responseGetMerchantData.length > 0)) {
//                                     dataToUpdateInMerchants = [];
//                                     merchantInfo.entityName ? (dataToUpdateInMerchants.push(merchantInfo.entityName)) : (dataToUpdateInMerchants.push(responseGetMerchantData[0].entityName))
//                                     merchantInfo.entityId ? (dataToUpdateInMerchants.push(merchantInfo.entityId)) : (dataToUpdateInMerchants.push(responseGetMerchantData[0].entityId))
//                                     merchantInfo.accountId ? (dataToUpdateInMerchants.push(merchantInfo.accountId)) : (dataToUpdateInMerchants.push(responseGetMerchantData[0].accountId))
//                                     merchantInfo.memberId ? (dataToUpdateInMerchants.push(merchantInfo.memberId)) : (dataToUpdateInMerchants.push(responseGetMerchantData[0].memberId))

//                                     dataToUpdateInMerchants.push(merchant);
//                                     db.query("update merchantdata set entityName = ?, entityId = ?, accountId = ?, memberId = ? where merchantId = ?", dataToUpdateInMerchants, function (errorUpdateMerchantData, responseUpdateMerchantData) {
//                                         if (!errorUpdateMerchantData) {
//                                             callback();
//                                         }
//                                         else {
//                                             callback();
//                                         }
//                                     })

//                                 }
//                                 else {
//                                     callback();
//                                 }
//                             })
//                         }
//                         else {
//                             callback();
//                         }
//                     })

//                 }
//                 else {
//                     callback();
//                 }
//             })
//         }
//         else {
//             callback();
//         }
//     })


// }