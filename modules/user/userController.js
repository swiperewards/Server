var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var nodeMailer = require('nodemailer');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var emailHandler = require(path.resolve('./', 'utils/emailHandler.js'));
var template = require(path.resolve('./', 'utils/emailTemplates.js'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));
var functions = require(path.resolve('./', 'utils/functions.js'));
var fs = require("fs");
var randomstring = require("randomstring");
var DateDiff = require('date-diff');

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

exports.listBuckets = function (req, res) {
    s3.listBuckets({}, function (err, data) {
        if (err) {
            return res.send({ "error": err });
        }
        res.send({ data });
    });
}



/*
Codes used :
1001 Failed to send Verification link to linked mail
1004 Email Already Exists
1005 db error
1002 Verification pending
1003 Please check username or password
1006 Entered wrong old password
1007 Please send profile image file
1008 Error while uploading file
1009 Invalid email id
1010 You are not authorized
1011 Token expired
1012 No email found
1013 Failed to send Password reset link to linked mail
1014 Invalid email address
1050 invalid token
*/

exports.registerUser = function (req, res) {
    var user = {
        'fullName': req.body.requestData.fullName,
        'mobileNumber': !req.body.requestData.mobileNumber ? null : req.body.requestData.mobileNumber,
        'emailId': req.body.requestData.emailId,
        'password': req.body.requestData.password ? req.body.requestData.password : null,
        'platform': req.body.platform,
        'deviceId': req.body.deviceId,
        'lat': req.body.requestData.lat,
        'long': req.body.requestData.long,
        'pincode': !req.body.requestData.pincode ? null : req.body.requestData.pincode,
        'city': !req.body.requestData.city ? null : req.body.requestData.city,
        'isSocialLogin': (req.body.requestData.isSocialLogin == false) ? 0 : 1,
        'profilePicUrl': !req.body.requestData.isSocialLogin ? null : req.body.requestData.profilePicUrl,
        'socialToken': !req.body.requestData.isSocialLogin ? null : req.body.requestData.socialToken,
        'referredBy': !req.body.requestData.referredBy ? null : req.body.requestData.referredBy
    }

    var randomNumForReferral = randomstring.generate({
        length: 8,
        charset: 'numeric'
    });
    randomNumForReferral = randomNumForReferral + "";

    var params = [user.fullName, user.mobileNumber, user.emailId, user.password, user.platform, user.deviceId, user.lat, user.long, user.pincode, user.city, user.isSocialLogin, user.profilePicUrl, user.socialToken, user.referredBy, randomNumForReferral]

    db.query('call SignupUserV2(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results) {
        if (!error) {
            //check for email already exists in DB
            if (results[0][0].IsOldRecord == 1) {
                logger.warn("Email Already Exists");
                res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
            }
            else if (results[0][0].InvalidReferralCode == 1) {
                logger.warn("Invalid referral code");
                res.send(responseGenerator.getResponse(1096, "Invalid referral code", null));
            }
            else {
                var data = {
                    emailId: results[0][0].emailId,
                    name: results[0][0].fullName,
                    userId: results[0][0].userId,
                    isNewRecord: results[0][0].isNewRecord
                }
                //generation of jwt token
                var token = jwt.sign(
                    {
                        emailId: results[0][0].emailId,
                        name: results[0][0].fullName,
                        userId: results[0][0].userId
                    }, config.privateKey, {
                        expiresIn: '365d'
                    });


                if (results[0][0].modifiedDate) {
                    logger.info("registerUser - Success " + results[0][0].userId);

                    res.send(responseGenerator.getResponse(200, "Success", {
                        token: token,
                        name: results[0][0].fullName,
                        emailId: results[0][0].emailId,
                        userId: results[0][0].userId,
                        isNewRecord: results[0][0].isNewRecord
                    }))
                }
                else {
                    var reqId = randomstring.generate(6);
                    var query = "insert into account_activation_requests (requestId, emailId) values (?,?)";
                    var params = [reqId, results[0][0].emailId];
                    db.query(query, params, function (errorInsertActivateToken, resultsInsertActivateToken) {
                        if (!errorInsertActivateToken) {

                            var message;
                            template.activateAccount(results[0][0].fullName, reqId, 4, null, function (err, msg) {
                                message = msg;
                            })
                            emailHandler.sendEmail(results[0][0].emailId, "Welcome to Nouvo!", message, function (errorEmailHandler) {
                                if (errorEmailHandler) {
                                    logger.warn("Failed to send Verification link to linked mail");
                                    res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                                } else {
                                    logger.info("Verification link sent to mail");

                                    res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                                        name: results[0][0].name,
                                        emailId: results[0][0].emailId,
                                        userId: results[0][0].userId,
                                        isNewRecord: results[0][0].isNewRecord
                                    }))
                                }
                            });
                            
                        } else {
                            logger.error("Error while processing your request", errorInsertActivateToken);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
                        }
                    })

                }

            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


exports.registerUserWeb = function (req, res) {
    var user = {
        'fullName': req.body.requestData.fullName,
        'emailId': req.body.requestData.emailId,
        'password': req.body.requestData.password ? req.body.requestData.password : null,
        'platform': req.body.platform
    }
    var params = [user.fullName, user.emailId, user.password, user.platform]
    db.query('call SignupUserWeb(?,?,?,?)', params, function (error, results) {
        if (!error) {
            //check for email already exists in DB
            if (results[0][0].IsOldRecord == 1) {
                logger.warn("Email Already Exists");
                res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
            }
            else {
                var token = randomstring.generate(6);
                var query = "insert into account_activation_requests (requestId, emailId) values (?,?)";
                var params = [token, user.emailId];
                //=======================================code to send verification email on signup========================================================
                db.query(query, params, function (errorInsertActivateToken, resultsInsertActivateToken) {
                    if (!errorInsertActivateToken) {
                        var message;
                        fullName = "";
                        if (user.fullName) {
                            fullName = user.fullName;
                        }
                        template.activateAccount(fullName, token, 3, null, function (err, msg) {
                            message = msg;
                        })
                        emailHandler.sendEmail(user.emailId, "Welcome to Nouvo!", message, function (error, callback) {
                            if (error) {
                                logger.warn("Failed to send Verification link to linked mail");
                                res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                            } else {
                                logger.info("Verification link sent to mail");
                                res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                                    name: results[0][0].name,
                                    emailId: results[0][0].emailId,
                                    userId: results[0][0].userId
                                }))
                            }
                        });
                        //========================================end of code for mail verification=================================================================
                    } else {
                        logger.error("Error while processing your request", errorInsertActivateToken);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
                    }
                })

            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}


exports.loginUser = function (req, res) {

    var strQuery = {
        sql: "select * from users where emailId = ? and password = ? and isDeleted = ? and roleId = ? and isUserVerified = ?",
        values: [req.body.requestData.emailId, req.body.requestData.password, 0, 4, 1]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (results && results.length > 0) {
                var data = {
                    emailId: results[0].emailId,
                    fullName: results[0].fullName,
                    userId: results[0].userId
                }
                //generation of jwt token
                var token = jwt.sign(
                    {
                        emailId: results[0].emailId,
                        fullName: results[0].fullName,
                        userId: results[0].userId
                    }, config.privateKey, {
                        expiresIn: '365d'
                    });
                // finalCallback(null, results)
                if (results[0].isUserVerified) {
                    res.send(responseGenerator.getResponse(200, "Login successful", {
                        token: token,
                        fullName: results[0].fullName,
                        emailId: results[0].emailId,
                        userId: results[0].userId
                    }))
                }
                else {
                    res.send(responseGenerator.getResponse(1002, "Verification pending", null))
                }

            }
            else {
                res.send(responseGenerator.getResponse(1003, "Please check username or password", null))
                // finalCallback("Please check username or password", null)
            }
        }
    });

}



exports.getUserProfile = function (req, res) {

    var user = {
        'userId': req.result.userId
    }

    var strQuery = {
        sql: "select * from users where userId = ?",
        values: [user.userId]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (results && results.length > 0) {
                res.send(responseGenerator.getResponse(200, "Success", results[0]))
            }
            else {
                res.send(responseGenerator.getResponse(1092, "Account does not exist", null))
            }
        }
    });

}



exports.activateAccount = function (req, res) {

    var strQuery = {
        sql: "select emailId, createdDate from account_activation_requests where requestId = ? and isDeleted = ?",
        values: [req.body.requestData.activateToken, 0]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (results && results.length > 0) {
                var tokenCreatedDate = new Date(results[0].createdDate);
                var currentDate = Date.now();
                var diff = new DateDiff(currentDate, tokenCreatedDate);
                var diffInMinutes = diff.minutes();
                if ((diffInMinutes > 0) && (diffInMinutes < 1441)) {

                    var user = {
                        'requestId': req.body.requestData.activateToken,
                        'emailId': results[0].emailId
                    }
                    // parameter to be passed to update password
                    params = [1, user.emailId]
                    db.query("update users set isUserVerified = ? where emailId = ?", params, function (errorActivation, resultsActivation) {
                        if (!errorActivation) {
                            if (resultsActivation.affectedRows == 0) {
                                logger.info("setPassword - email not found - " + user.emailId);
                                res.send(responseGenerator.getResponse(1012, "No email found", null))
                            }
                            else {
                                // parameter to be passed to update password
                                params = [1, user.emailId, user.requestId]
                                db.query("update account_activation_requests set isDeleted = ? where emailId = ? and requestId = ?", params, function (errorDeleteToken, resultsDeleteToken) {
                                    if (!errorDeleteToken) {
                                        if (resultsDeleteToken.affectedRows == 0) {
                                            logger.info("activateAccount - email not found - " + user.emailId);
                                            res.send(responseGenerator.getResponse(1012, "No email found", null))
                                        }
                                        else {
                                            logger.info("activateAccount -Account activated successfully - " + user.emailId);
                                            res.send(responseGenerator.getResponse(200, "Success", null))
                                        }

                                    } else {
                                        logger.error("Error while processing your request", errorDeleteToken);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, errorDeleteToken))
                                    }
                                })
                            }

                        } else {
                            logger.error("Error while processing your request", errorActivation);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, errorActivation))
                        }
                    })
                }
                else {
                    res.send(responseGenerator.getResponse(1011, "Token expired", null))
                }
            }
            else {
                res.send(responseGenerator.getResponse(1092, "Account does not exist", null))
            }
        }
    });

}



exports.changePassword = function (req, res) {

    var user = {
        'userId': req.result.userId,
        'password': req.body.requestData.password,
        'oldPassword': req.body.requestData.oldPassword,
    }
    // parameter to be passed to update password
    params = [user.password, user.userId, user.oldPassword]
    db.query("update users set password = ? where userId = ? and password = ?", params, function (error, results) {
        if (!error) {
            if (results.affectedRows == 0) {
                logger.info("changePassword - Entered wrong old password for user - " + user.userId);
                res.send(responseGenerator.getResponse(1006, "Entered wrong old password", null))
            }
            else {
                logger.info("Password updated successfully for user - " + user.userId);
                res.send(responseGenerator.getResponse(200, "Password updated successfully", null))
            }

        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })

}



exports.toggleNotification = function (req, res) {

    var user = {
        'userId': req.result.userId,
        'enableNotification': req.body.requestData.enableNotification ? 1 : 0
    }
    // parameter to be passed to update password
    params = [user.enableNotification, user.userId]
    db.query("update users set isNotificationEnabled = ? where userId = ?", params, function (error, results) {
        if (!error) {
            logger.info("toggleNotification - Toggled notification for user - " + user.userId);
            res.send(responseGenerator.getResponse(200, "Success", {
                "enableNotification": user.enableNotification ? true : false
            }))

        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}



exports.updateProfilePic = function (req, res) {

    var user = {
        'userId': req.result.userId
    }
    var ProfilePicUrl = "https://s3.amazonaws.com/swipe-webpage-pictures/" + user.userId + ".jpg";

    buf = new Buffer(req.body.requestData.image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    var data = {
        Key: user.userId + ".jpg",
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
        Bucket: config.bucketName,
        ACL: 'public-read'
    };

    s3.putObject(data, function (err, data) {
        if (err) {
            console.log(err);
            console.log('Error uploading data: ', data);
        } else {
            params = [ProfilePicUrl, user.userId]
            db.query("update users set profilePicUrl = ? where userId = ?", params, function (error, results) {
                if (!error) {
                    logger.info("updateProfilePic - Profile pic updated for user - " + user.userId);
                    res.send(responseGenerator.getResponse(200, "Success", { "imageUrl": ProfilePicUrl }))

                } else {
                    logger.error("updateProfilePic - Error while processing your request", error);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                }
            })
        }
    });
}




exports.updateUserProfile = function (req, res) {

    var user = {
        'userId': req.result.userId,
        'fullName': req.body.requestData.fullName,
        'password': req.body.requestData.password
    }

    query = "update users set fullName = ? ";
    params = [user.fullName];

    user.password ? ((query = query + ", password = ? ") && params.push(user.password)) : 0;
    query = query + "where userId = ?";
    params.push(user.userId);


    db.query(query, params, function (error, results) {
        if (!error) {
            logger.info("updateUserProfile - Profile updated for user - " + user.userId);
            res.send(responseGenerator.getResponse(200, "Success", null));
        } else {
            logger.error("updateUserProfile - Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, error));
        }
    });
}




exports.forgotPassword = function (req, res) {
    var strQuery = {
        sql: "select userId, fullName from users where emailId = ? and isDeleted = ?",
        values: [req.body.requestData.emailId, 0]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (results && results.length > 0) {

                var user = {
                    'emailId': req.body.requestData.emailId,
                    'fullName': results[0].fullName,
                    'platform': req.body.platform,
                    'deviceId': req.body.deviceId
                };
                var reqIdGenerated = randomstring.generate(6);
                var query = "insert into password_reset_requests (requestId, emailId) values (?,?)";
                var params = [reqIdGenerated, user.emailId];

                db.query(query, params, function (error, results) {
                    if (!error) {
                        var message;
                        template.forgotPassword(user.fullName, reqIdGenerated, function (err, msg) {
                            message = msg;
                        })
                        emailHandler.sendEmail(user.emailId, "Nouvo, Forgot password link", message, function (error, callback) {
                            if (error) {
                                logger.warn("Failed to send Password reset link to linked mail");
                                res.send(responseGenerator.getResponse(1013, "Failed to send Password reset link to linked mail", null))
                            } else {
                                logger.info("Password reset link sent to mail");
                                res.send(responseGenerator.getResponse(200, "Success", { 'emailId': req.body.requestData.emailId }))
                            }
                        });
                    } else {
                        logger.error("Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
            else {
                res.send(responseGenerator.getResponse(1014, "Invalid email address", null))
                // finalCallback("Please check username or password", null)
            }
        }
    });
}


exports.setPassword = function (req, res) {

    var strQuery = {
        sql: "select emailId, createdDate from password_reset_requests where requestId = ? and isDeleted = ?",
        values: [req.body.requestData.resetToken, 0]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (results && (results.length > 0)) {
                var tokenCreatedDate = new Date(results[0].createdDate);
                var currentDate = Date.now();
                var diff = new DateDiff(currentDate, tokenCreatedDate);
                var diffInMinutes = diff.minutes();
                if ((diffInMinutes > 0) && (diffInMinutes < 1441)) {

                    var user = {
                        'emailId': results[0].emailId,
                        'password': req.body.requestData.password
                    }
                    // parameter to be passed to update password
                    params = [user.password, user.emailId]
                    db.query("update users set password = ? where emailId = ?", params, function (error, results) {
                        if (!error) {
                            if (results.affectedRows == 0) {
                                logger.info("setPassword - email not found - " + user.emailId);
                                res.send(responseGenerator.getResponse(1012, "No email found", null))
                            }
                            else {
                                // parameter to be passed to update password
                                params = [1, user.emailId]
                                db.query("update password_reset_requests set isDeleted = ? where emailId = ?", params, function (error, results) {
                                    if (!error) {
                                        if (results.affectedRows == 0) {
                                            logger.info("setPassword - email not found - " + user.emailId);
                                            res.send(responseGenerator.getResponse(1012, "No email found", null))
                                        }
                                        else {
                                            logger.info("Password updated successfully for user - " + user.emailId);
                                            res.send(responseGenerator.getResponse(200, "Password updated successfully", null))
                                        }
                                    } else {
                                        logger.error("Error while processing your request", error);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                    }
                                })
                            }
                        } else {
                            logger.error("Error while processing your request", error);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                        }
                    })
                }
                else {
                    res.send(responseGenerator.getResponse(1011, "Token expired", null))
                }
            }
            else {
                res.send(responseGenerator.getResponse(1010, msg.notAuthorized, null))
                // finalCallback("Please check username or password", null)
            }
        }
    });
}




// Web api's below


exports.loginUserWeb = function (req, res) {

    var strQuery = {
        sql: "select u.emailId, u.fullName, u.userId, u.roleId, u.isUserVerified, u.profilePicUrl, u.merchantId, mr.name as role from users u join mst_role mr on u.roleId = mr.id where u.emailId = ? and u.password = ? and u.isDeleted = ? and u.status = ?",
        values: [req.body.requestData.emailId, req.body.requestData.password, 0, 1]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {

            if (results && results.length > 0) {
                if (results[0].roleId == 4) {
                    res.send(responseGenerator.getResponse(1003, "Please check username or password", null))
                }
                else {
                    var query = {
                        sql: "select mp.text, mp.iconName, mp.link, p.displayOrder from mst_role mr join privileges p on mr.id = p.roleId join mst_privileges mp on p.menuId = mp.id where mr.id = ? and p.isDeleted = ? and mp.isDeleted = ? and mr.isDeleted = ?",
                        values: [results[0].roleId, 0, 0, 0]
                    };

                    db.query(query, function (errorPrivileges, resultsPrivileges, fieldsPrivileges) {
                        if (errorPrivileges) {
                            logger.error("Error while processing your request", errorPrivileges);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                        } else {


                            var dataForToken = {
                                emailId: results[0].emailId,
                                fullName: results[0].fullName,
                                userId: results[0].userId,
                                roleId: results[0].roleId,
                            }
                            // generation of jwt token
                            var token = jwt.sign(
                                {
                                    emailId: results[0].emailId,
                                    fullName: results[0].fullName,
                                    userId: results[0].userId,
                                    roleId: results[0].roleId,
                                }, config.privateKey, {
                                    expiresIn: '365d'
                                });

                            var userData = {
                                emailId: results[0].emailId,
                                fullName: results[0].fullName,
                                userId: results[0].userId,
                                role: results[0].role,
                                profilePicUrl: results[0].profilePicUrl,
                                merchantId: results[0].merchantId,
                                menuList: resultsPrivileges,
                                isUserVerified: results[0].isUserVerified,
                                token: token
                            }

                            if (results[0].isUserVerified) {
                                res.send(responseGenerator.getResponse(200, "Login successful", userData))
                            }
                            else {
                                res.send(responseGenerator.getResponse(1002, "Verification pending", null))
                            }
                        }
                    });
                }
            }
            else {
                res.send(responseGenerator.getResponse(1003, "Please check username or password", null))
            }
        }
    });

}


exports.resendVerificationEmail = function (req, res) {


    var user = {
        'emailId': req.body.requestData.emailId
    }

    var token = randomstring.generate(6);
    var query = "insert into account_activation_requests (requestId, emailId) values (?,?)";
    var params = [token, user.emailId];
    //=======================================code to send verification email on signup========================================================
    db.query(query, params, function (errorInsertActivateToken, resultsInsertActivateToken) {
        var query = "select userId, fullName from users where emailId = ?";
        var params = [user.emailId];

        db.query(query, params, function (errorGetData, resultsGetData) {
            if (!errorGetData) {
                if (!errorInsertActivateToken) {
                    var message;
                    fullName = "";
                    if (resultsGetData[0].fullName) {
                        fullName = resultsGetData[0].fullName;
                    }
                    template.activateAccount(resultsGetData[0].fullName, token, 3, null, function (err, msg) {
                        message = msg;
                    })
                    emailHandler.sendEmail(user.emailId, "Welcome to Nouvo!", message, function (error, callback) {
                        if (error) {
                            logger.warn("Failed to send Verification link to linked mail");
                            res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                        } else {
                            logger.info("Verification link sent to mail");
                            res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                                name: resultsGetData[0].fullName,
                                emailId: user.emailId,
                                userId: resultsGetData[0].userId
                            }))
                        }
                    });
                    //========================================end of code for mail verification=================================================================
                } else {
                    logger.error("Error while processing your request", errorInsertActivateToken);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
                }
            }
            else {
                logger.error("Error while processing your request", errorInsertActivateToken);
                res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
            }
        })
    })

}

//not used
// exports.registerUserWeb = function (req, res) {

//     var user = {
//         'fullName': req.body.requestData.fullName,
//         'emailId': req.body.requestData.emailId,
//         'password': req.body.requestData.password,
//         'platform': req.body.platform,
//         'roleId': req.body.requestData.roleId
//     }

//     db.query('call SignupUserWeb(?,?,?,?,?)', [user.fullName, user.emailId, user.password, user.platform, user.roleId], function (error, results) {
//         if (!error) {
//             //check for email already exists in DB
//             if (results[0][0].IsNewRecord == 1) {
//                 logger.warn("Email Already Exists");
//                 res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
//             }
//             else {
//                 var data = {
//                     emailId: results[0][0].emailId,
//                     name: results[0][0].name,
//                     userId: results[0][0].userId
//                 }
//                 //generation of jwt token
//                 var token = jwt.sign(
//                     {
//                         emailId: results[0][0].emailId,
//                         name: results[0][0].name,
//                         userId: results[0][0].userId
//                     }, config.privateKey, {
//                         expiresIn: '1d'
//                     });

//                 //=======================================code to send verification email on signup========================================================
//                 var message;
//                 template.welcome(user.fullName, token, function (err, msg) {
//                     message = msg;
//                 })
//                 emailHandler.sendEmail(user.emailId, "Welcome to Swipe Rewards", message, function (error, callback) {
//                     if (error) {
//                         logger.warn("Failed to send Verification link to linked mail");
//                         res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
//                     } else {
//                         logger.info("Verification link sent to mail");

//                         res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
//                             name: results[0][0].name,
//                             emailId: results[0][0].emailId,
//                             userId: results[0][0].userId
//                         }))
//                     }
//                 });
//                 //========================================end of code for mail verification=================================================================
//             }
//         } else {
//             logger.error("Error while processing your request", error);
//             res.send(responseGenerator.getResponse(1005, msg.dbError, null))
//         }
//     })
// }




exports.addAdmin = function (req, res) {
    var admin =
        {
            'fullName': req.body.requestData.fullName,
            'contactNumber': req.body.requestData.contactNumber ? req.body.requestData.contactNumber : null,
            'emailId': req.body.requestData.emailId,
            'status': req.body.requestData.status
        }

    var query = {
        sql: "select userId, fullName from users where emailId = ?",
        values: [admin.emailId]
    };

    db.query(query, function (errorEmailCheck, resultsEmailCheck, fieldsEmailCheck) {
        if (errorEmailCheck) {
            logger.error("Error while processing your request", errorEmailCheck);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (resultsEmailCheck.length == 0) {
                var randomPassword = randomstring.generate(8);
                var token = randomstring.generate(6);
                var params = [admin.fullName, admin.contactNumber, admin.emailId, admin.status, randomPassword, token];
                db.query('call CreateAdmin(?,?,?,?,?,?)', params, function (errorCreateAdmin, resultsCreateAdmin) {
                    if (!errorCreateAdmin) {
                        var ProfilePicUrl = "https://s3.amazonaws.com/swipe-webpage-pictures/" + resultsCreateAdmin[0][0].userId + ".jpg";

                        if (req.body.requestData.profilePic) {
                            buf = new Buffer(req.body.requestData.profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')
                            var data = {
                                Key: resultsCreateAdmin[0][0].userId + ".jpg",
                                Body: buf,
                                ContentEncoding: 'base64',
                                ContentType: 'image/jpeg',
                                Bucket: config.bucketName,
                                ACL: 'public-read'
                            };

                            s3.putObject(data, function (err, data) {
                                if (err) {
                                    logger.error("addAdmin - ", err.message);
                                    res.send(responseGenerator.getResponse(1094, "Something went wrong", err));
                                } else {
                                    params = [ProfilePicUrl, resultsCreateAdmin[0][0].userId]
                                    db.query("update users set profilePicUrl = ? where userId = ?", params, function (errorProfilePicUrlUpdate, resultsProfilePicUrlUpdate) {
                                        if (!errorProfilePicUrlUpdate) {
                                            var message;
                                            fullName = "";
                                            if (req.body.requestData.fullName) {
                                                fullName = req.body.requestData.fullName;
                                            }
                                            template.activateAccount(fullName, token, 2, randomPassword, function (err, msg) {
                                                message = msg;
                                            })
                                            emailHandler.sendEmail(admin.emailId, "Welcome to Nouvo!", message, function (error, callback) {
                                                if (error) {
                                                    logger.warn("Failed to send Verification link to linked mail");
                                                    res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                                                } else {
                                                    logger.info("Verification link sent to mail");
                                                    res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                                                        name: resultsCreateAdmin[0][0].fullName,
                                                        emailId: resultsCreateAdmin[0][0].emailId,
                                                        userId: resultsCreateAdmin[0][0].userId,
                                                        profilePicUrl: ProfilePicUrl
                                                    }))
                                                }
                                            });


                                        } else {
                                            logger.error("updateProfilePic - Error while processing your request", errorProfilePicUrlUpdate);
                                            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                        }
                                    })
                                }
                            });
                        }
                        else {
                            var message;
                            fullName = "";
                            if (req.body.requestData.fullName) {
                                fullName = req.body.requestData.fullName;
                            }
                            template.activateAccount(fullName, token, 2, randomPassword, function (err, msg) {
                                message = msg;
                            })
                            emailHandler.sendEmail(admin.emailId, "Welcome to Nouvo!", message, function (error, callback) {
                                if (error) {
                                    logger.warn("Failed to send Verification link to linked mail");
                                    res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                                } else {
                                    logger.info("Verification link sent to mail");
                                    res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                                        name: resultsCreateAdmin[0][0].fullName,
                                        emailId: resultsCreateAdmin[0][0].emailId,
                                        userId: resultsCreateAdmin[0][0].userId
                                    }))
                                }
                            });
                        }
                    } else {
                        logger.error("Error while processing your request", errorCreateAdmin);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
            else {
                logger.warn("Email Already Exists");
                res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
            }

        }
    });


}



exports.updateAdmin = function (req, res) {
    var admin =
        {
            'userId': req.body.requestData.userId,
            'fullName': req.body.requestData.fullName,
            'contactNumber': !req.body.requestData.contactNumber ? null : req.body.requestData.contactNumber,
            'emailId': req.body.requestData.emailId,
            'status': (req.body.requestData.status == "1") ? "1" : "0",
            'profilePic': req.body.requestData.profilePic
        }
    if (admin.profilePic.length > 100) {
        var ProfilePicUrl = "https://s3.amazonaws.com/swipe-webpage-pictures/" + admin.userId + ".jpg";

        buf = new Buffer(admin.profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')
        var data = {
            Key: admin.userId + ".jpg",
            Body: buf,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg',
            Bucket: config.bucketName,
            ACL: 'public-read'
        };

        s3.putObject(data, function (err, data) {
            if (err) {
                logger.error("updateAdmin - ", err.message);
                res.send(responseGenerator.getResponse(1094, "Something went wrong", err));
            } else {
                var query = "update users set profilePicUrl = ?, fullName = ?, emailId = ?, status = ?, contactNumber = ? where userId = ? and isDeleted = ? and roleId = ?";

                var params = [ProfilePicUrl, admin.fullName, admin.emailId, admin.status, admin.contactNumber, admin.userId, 0, 2];

                db.query(query, params, function (errorUpdateAdmin, resultsUpdateAdmin, fieldsUpdateAdmin) {
                    if (errorUpdateAdmin) {
                        logger.error("Error while processing your request", errorUpdateAdmin);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    } else {
                        if (resultsUpdateAdmin.affectedRows == 1) {
                            logger.info("admin updated successfully");
                            res.send(responseGenerator.getResponse(200, "Admin updated successfully", null));
                        }
                        else {
                            logger.warn("Invalid email");
                            res.send(responseGenerator.getResponse(1085, "Invalid email", null));
                        }
                    }
                });

            }
        });
    }
    else {
        var query = "update users set fullName = ?, emailId = ?, status = ?, contactNumber = ? where userId = ? and isDeleted = ? and roleId = ?";

        var params = [admin.fullName, admin.emailId, admin.status, admin.contactNumber, admin.userId, 0, 2];

        db.query(query, params, function (errorUpdateAdmin, resultsUpdateAdmin, fieldsUpdateAdmin) {
            if (errorUpdateAdmin) {
                logger.error("Error while processing your request", errorUpdateAdmin);
                res.send(responseGenerator.getResponse(1005, msg.dbError, null))
            } else {
                if (resultsUpdateAdmin.affectedRows == 1) {
                    logger.info("admin updated successfully");
                    res.send(responseGenerator.getResponse(200, "Admin updated successfully", null));
                }
                else {
                    logger.warn("Invalid email");
                    res.send(responseGenerator.getResponse(1085, "Invalid email", null));
                }
            }
        });
    }
}



exports.updateUser = function (req, res) {
    var User =
        {
            'userId': req.body.requestData.userId,
            'isEmailUpdated': req.body.requestData.isEmailUpdated,
            'fullName': req.body.requestData.fullName,
            'contactNumber': !req.body.requestData.contactNumber ? null : req.body.requestData.contactNumber,
            'emailId': req.body.requestData.emailId,
            'status': (req.body.requestData.status == "1") ? "1" : "0",
            'profilePic': req.body.requestData.profilePic,
            "password": req.body.requestData.password,
            "city": req.body.requestData.city,
            "zipcode": req.body.requestData.zipcode,
            "roleId": req.body.requestData.roleId,
            "isPasswordUpdated": req.body.requestData.isPasswordUpdated
        }
    var query = "";
    var params;
    var returned = false;
    var password = "";
    if (User.isPasswordUpdated == "1"){
        password = User.password;
    }
    else {
        password = randomstring.generate(8);
    }
    if (User.isEmailUpdated == "1") {
        query = "SELECT emailId FROM users WHERE emailId = ?";
        params = [User.emailId];
        db.query(query, params, function (errorEmailCheck, resultsEmailCheck) {
            if (!errorEmailCheck) {
                if (resultsEmailCheck.length > 0) {
                    logger.warn("Email Already Exists");
                    returned = true;
                    res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
                }
                else {
                    if (User.profilePic.length > 100) {
                        var ProfilePicUrl = "https://s3.amazonaws.com/swipe-webpage-pictures/" + User.userId + ".jpg";
                        buf = new Buffer(User.profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')
                        var data = {
                            Key: User.userId + ".jpg",
                            Body: buf,
                            ContentEncoding: 'base64',
                            ContentType: 'image/jpeg',
                            Bucket: config.bucketName,
                            ACL: 'public-read'
                        };

                        s3.putObject(data, function (err, data) {
                            if (err) {
                                logger.error("updateUser - ", err.message);
                                res.send(responseGenerator.getResponse(1094, "Something went wrong", err));
                            } else {
                                query = "update users set profilePicUrl = ?, fullName = ?, emailId = ?, status = ?, contactNumber = ?, password = ?, city = ?, pincode = ?, isUserVerified = ?, modifiedDate = ? where userId = ? and isDeleted = ?";

                                params = [ProfilePicUrl, User.fullName, User.emailId, User.status, User.contactNumber, User.password, User.city, User.zipcode, 0, new Date(Date.now()), User.userId, 0];

                                db.query(query, params, function (errorUpdateUser, resultsUpdateUser, fieldsUpdateUser) {
                                    if (errorUpdateUser) {
                                        logger.error("Error while processing your request", errorUpdateUser);
                                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                    } else {
                                        if (resultsUpdateUser.affectedRows == 1) {
                                            var reqId = randomstring.generate(6);
                                            query = "insert into account_activation_requests (requestId, emailId) values (?,?)";
                                            params = [reqId, results[0][0].emailId];
                                            db.query(query, params, function (errorInsertActivateToken, resultsInsertActivateToken) {
                                                if (!errorInsertActivateToken) {
                                                    var message;
                                                    var fullName = User.fullName;
                                                    if(!fullName){
                                                        fullName = "";
                                                    }
                                                    template.activateAccount(fullName, reqId, User.roleId, password, function (err, msg) {
                                                        message = msg;
                                                    })
                                                    emailHandler.sendEmail(User.emailId, "Welcome to Nouvo!", message, function (errorEmailHandler) {
                                                        if (errorEmailHandler) {
                                                            logger.warn("Failed to send Verification link to linked mail");
                                                            res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                                                        } else {
                                                            logger.info("Verification link sent to mail");
                                                            logger.info("User updated successfully");
                                                            res.send(responseGenerator.getResponse(200, "User updated successfully, Verification link sent to mail", null));
                                                        }
                                                    });
                                                } else {
                                                    logger.error("Error while processing your request", errorInsertActivateToken);
                                                    res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
                                                }
                                            })
                                        }
                                        else {
                                            logger.warn("Invalid email");
                                            res.send(responseGenerator.getResponse(1085, "Invalid email", null));
                                        }
                                    }
                                });

                            }
                        });
                    }
                    else {
                        query = "update users set fullName = ?, emailId = ?, status = ?, contactNumber = ?, password = ?, city = ?, pincode = ?, isUserVerified = ?, modifiedDate = ? where userId = ? and isDeleted = ?";

                        params = [User.fullName, User.emailId, User.status, User.contactNumber, User.password, User.city, User.zipcode, 0, new Date(Date.now()), User.userId, 0];

                        db.query(query, params, function (errorUpdateUser, resultsUpdateUser, fieldsUpdateUser) {
                            if (errorUpdateUser) {
                                logger.error("Error while processing your request", errorUpdateUser);
                                res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                            } else {
                                if (resultsUpdateUser.affectedRows == 1) {
                                    var reqId = randomstring.generate(6);
                                    query = "insert into account_activation_requests (requestId, emailId) values (?,?)";
                                    params = [reqId, User.emailId];
                                    db.query(query, params, function (errorInsertActivateToken, resultsInsertActivateToken) {
                                        if (!errorInsertActivateToken) {

                                            var message;var fullName = User.fullName;
                                            if(!fullName){
                                                fullName = "";
                                            }
                                            template.activateAccount(fullName, reqId, User.roleId, password, function (err, msg) {
                                                message = msg;
                                            })
                                            emailHandler.sendEmail(User.emailId, "Welcome to Nouvo!", message, function (errorEmailHandler) {
                                                if (errorEmailHandler) {
                                                    logger.warn("Failed to send Verification link to linked mail");
                                                    res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                                                } else {
                                                    logger.info("Verification link sent to mail");

                                                    logger.info("User updated successfully");
                                                    res.send(responseGenerator.getResponse(200, "User updated successfully, Verification link sent to mail", null));
                                                }
                                            });
                                        } else {
                                            logger.error("Error while processing your request", errorInsertActivateToken);
                                            res.send(responseGenerator.getResponse(1005, msg.dbError, errorInsertActivateToken))
                                        }
                                    })
                                }
                                else {
                                    logger.warn("Invalid email");
                                    res.send(responseGenerator.getResponse(1085, "Invalid email", null));
                                }
                            }
                        });
                    }
                }
            }
        });
    }
    else {
        if (User.profilePic.length > 100) {
            var ProfilePicUrl = "https://s3.amazonaws.com/swipe-webpage-pictures/" + User.userId + ".jpg";

            buf = new Buffer(User.profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')
            var data = {
                Key: User.userId + ".jpg",
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                Bucket: config.bucketName,
                ACL: 'public-read'
            };

            s3.putObject(data, function (err, data) {
                if (err) {
                    logger.error("updateUser - ", err.message);
                    res.send(responseGenerator.getResponse(1094, "Something went wrong", err));
                } else {
                    query = "update users set profilePicUrl = ?, fullName = ?, emailId = ?, status = ?, contactNumber = ?, password = ?, city = ?, pincode = ?, modifiedDate = ? where userId = ? and isDeleted = ?";

                    params = [ProfilePicUrl, User.fullName, User.emailId, User.status, User.contactNumber, User.password, User.city, User.zipcode, new Date(Date.now()), User.userId, 0];

                    db.query(query, params, function (errorUpdateUser, resultsUpdateUser, fieldsUpdateUser) {
                        if (errorUpdateUser) {
                            logger.error("Error while processing your request", errorUpdateUser);
                            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                        } else {
                            if (resultsUpdateUser.affectedRows == 1) {
                                logger.info("User updated successfully");
                                res.send(responseGenerator.getResponse(200, "User updated successfully", null));
                            }
                            else {
                                logger.warn("Invalid email");
                                res.send(responseGenerator.getResponse(1085, "Invalid email", null));
                            }
                        }
                    });

                }
            });
        }
        else {
            query = "update users set fullName = ?, emailId = ?, status = ?, contactNumber = ?, password = ?, city = ?, pincode = ?, modifiedDate = ? where userId = ? and isDeleted = ?";

            params = [User.fullName, User.emailId, User.status, User.contactNumber, User.password, User.city, User.zipcode, new Date(Date.now()), User.userId, 0];

            db.query(query, params, function (errorUpdateUser, resultsUpdateUser, fieldsUpdateUser) {
                if (errorUpdateUser) {
                    logger.error("Error while processing your request", errorUpdateUser);
                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                } else {
                    if (resultsUpdateUser.affectedRows == 1) {
                        logger.info("User updated successfully");
                        res.send(responseGenerator.getResponse(200, "User updated successfully", null));
                    }
                    else {
                        logger.warn("Invalid email");
                        res.send(responseGenerator.getResponse(1085, "Invalid email", null));
                    }
                }
            });
        }
    }
}



exports.deleteAdmin = function (req, res) {

    var admin = {
        "id": req.body.requestData.id ? req.body.requestData.id : null
    }

    // parameter to be passed
    params = [1, admin.id, 0, 2];

    var query = "update users set isDeleted = ? where userId = ? and isDeleted = ? and roleId = ?";

    db.query(query, params, function (errorDeleteAdmin, resultsDeleteAdmin) {
        if (!errorDeleteAdmin) {
            if (resultsDeleteAdmin.affectedRows == 1) {
                logger.info("Admin deleted successfully");
                res.send(responseGenerator.getResponse(200, "Admin deleted successfully", admin));
            }
            else {
                logger.info("deleteAdmin - Invalid id - " + admin.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
        }
        else {
            logger.error("deleteAdmin - Error while processing your request", errorDeleteAdmin);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorDeleteAdmin))
        }
    });
}


exports.deleteUser = function (req, res) {

    var User = {
        "id": req.body.requestData.id ? req.body.requestData.id : null
    }

    // parameter to be passed
    params = [1, User.id, 0, 3, 4];

    var query = "update users set isDeleted = ? where userId = ? and isDeleted = ? and (roleId = ? or roleId = ?)";

    db.query(query, params, function (errorDeleteUser, resultsDeleteUser) {
        if (!errorDeleteUser) {
            if (resultsDeleteUser.affectedRows == 1) {
                logger.info("User deleted successfully");
                res.send(responseGenerator.getResponse(200, "User deleted successfully", User));
            }
            else {
                logger.info("deleteUser - Invalid id - " + User.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
        }
        else {
            logger.error("deleteUser - Error while processing your request", errorDeleteUser);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorDeleteUser))
        }
    });
}


exports.getAdminDetails = function (req, res) {

    var admin = {
        "id": req.body.requestData.id ? req.body.requestData.id : null
    }

    // parameter to be passed
    params = [admin.id];

    var query = "select * from users where userId = ?";

    db.query(query, params, function (errorGetAdminDetails, resultsGetAdminDetails) {
        if (!errorGetAdminDetails) {
            if (resultsGetAdminDetails.length == 1) {
                logger.info("Admin details fetched successfully");
                res.send(responseGenerator.getResponse(200, "Success", resultsGetAdminDetails[0]));
            }
            else {
                logger.info("getAdminDetails - Invalid id - " + admin.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
        }
        else {
            logger.error("getAdminDetails - Error while processing your request", errorGetAdminDetails);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorGetAdminDetails))
        }
    });
}



exports.getUserDetails = function (req, res) {

    var User = {
        "id": req.body.requestData.id ? req.body.requestData.id : null
    }

    // parameter to be passed
    params = [User.id, 3, 4];

    var query = "select * from users where userId = ? and (roleId = ? or roleId = ?)";

    db.query(query, params, function (errorGetUserDetails, resultsGetUserDetails) {
        if (!errorGetUserDetails) {
            if (resultsGetUserDetails.length == 1) {
                logger.info("User details fetched successfully");
                res.send(responseGenerator.getResponse(200, "Success", resultsGetUserDetails[0]));
            }
            else {
                logger.info("getUserDetails - Invalid id - " + User.id);
                res.send(responseGenerator.getResponse(1085, "Invalid id", null));
            }
        }
        else {
            logger.error("getUserDetails - Error while processing your request", errorGetUserDetails);
            res.send(responseGenerator.getResponse(1005, msg.dbError, errorGetUserDetails))
        }
    });
}



exports.getAdmins = function (req, res) {

    var data = {
        'name': req.body.requestData.name ? ('%' + req.body.requestData.name + '%') : '%%',
        'status': req.body.requestData.status ? ((req.body.requestData.status == '1') ? '%1%' : '%0%') : '%%',
        'pageNumber': req.body.requestData.pageNumber ? req.body.requestData.pageNumber : 0,
        'pageSize': req.body.requestData.pageSize ? req.body.requestData.pageSize : 0
    }

    // parameter to be passed to GetDeals procedure
    params = [data.name, data.status, data.pageNumber, data.pageSize]
    db.query('call GetAdmins(?,?,?,?)', params, function (errorGetAdmins, resultsGetAdmins) {
        if (!errorGetAdmins) {
            logger.error("getAdmins - success -" + req.result.userId);
            var admins = [];
            for (var i = 0; i < resultsGetAdmins[0].length; i++) {
                var obj = resultsGetAdmins[0][i];
                obj.serial_number = i + 1;
                admins.push(obj);
            }
            res.send(responseGenerator.getResponse(200, "Success", admins))
        }
        else {
            logger.error("getDealsWeb - Error while processing your request", errorGetAdmins);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}


exports.getUsers = function (req, res) {

    var data = {
        'name': req.body.requestData.name ? ('%' + req.body.requestData.name + '%') : '%%',
        'status': req.body.requestData.status ? ((req.body.requestData.status == '1') ? '%1%' : '%0%') : '%%',
        'pageNumber': req.body.requestData.pageNumber ? req.body.requestData.pageNumber : 0,
        'pageSize': req.body.requestData.pageSize ? req.body.requestData.pageSize : 0,
        'type': ((req.body.requestData.type == "Customer") || (req.body.requestData.type == "Merchant")) ? req.body.requestData.type : "Both"
    }

    // parameter to be passed to GetDeals procedure
    params = [data.name, data.status, data.pageNumber, data.pageSize, data.type]
    db.query('call GetUsers(?,?,?,?,?)', params, function (errorGetUsers, resultsGetUsers) {
        if (!errorGetUsers) {
            logger.error("getUsers - success -" + req.result.userId);
            var Users = [];
            for (var i = 0; i < resultsGetUsers[0].length; i++) {
                var obj = resultsGetUsers[0][i];
                obj.serial_number = i + 1;
                Users.push(obj);
            }
            res.send(responseGenerator.getResponse(200, "Success", Users))
        }
        else {
            logger.error("getDealsWeb - Error while processing your request", errorGetUsers);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}



exports.applyReferralCode = function (req, res) {

    var data = {
        'userId': req.result.userId,
        'referredBy': req.body.requestData.referredBy
    }

    // parameter to be passed to GetDeals procedure
    params = [data.userId, data.referredBy]
    db.query('call ApplyReferralCode(?,?)', params, function (errorApplyReferral, resultsApplyReferral) {
        if (!errorApplyReferral) {
            if (resultsApplyReferral[0][0].Success == 1) {
                logger.warn("ApplyReferralCode - success");
                res.send(responseGenerator.getResponse(200, "Success", null));
            }
            else if (resultsApplyReferral[0][0].InvalidReferralCode == 1) {
                logger.warn("Invalid referral code");
                res.send(responseGenerator.getResponse(1004, "Invalid referral code", null));
            }
            else {
                logger.warn("Already referred " + data.userId);
                res.send(responseGenerator.getResponse(1095, "Unable to refer", null));
            }

        }
        else {
            logger.error("getDealsWeb - Error while processing your request", errorGetUsers);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    });

}