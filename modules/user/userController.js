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
        'referredBy': !req.body.requestData.referralCode ? null : req.body.requestData.referredBy
    }
    var params = [user.fullName, user.mobileNumber, user.emailId, user.password, user.platform, user.deviceId, user.lat, user.long, user.pincode, user.city, user.isSocialLogin, user.profilePicUrl, user.socialToken, user.referredBy]
    db.query('call SignupUserV2(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results) {
        if (!error) {
            //check for email already exists in DB
            if (results[0][0].IsOldRecord == 1) {
                logger.warn("Email Already Exists");
                res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
            }
            else {
                var data = {
                    emailId: results[0][0].emailId,
                    name: results[0][0].name,
                    userId: results[0][0].userId
                }
                //generation of jwt token
                var token = jwt.sign(
                    {
                        emailId: results[0][0].emailId,
                        name: results[0][0].name,
                        userId: results[0][0].userId
                    }, config.privateKey, {
                        expiresIn: '365d'
                    });


                if (results[0][0].modifiedDate) {
                    logger.info("registerUser - Success " + results[0][0].userId);

                    res.send(responseGenerator.getResponse(200, "Success", {
                        token: token,
                        name: results[0][0].name,
                        emailId: results[0][0].emailId,
                        userId: results[0][0].userId
                    }))
                }
                else {
                    //=======================================code to send verification email on signup========================================================
                    var message;
                    template.welcome(user.fullName, token, function (err, msg) {
                        message = msg;
                    })
                    emailHandler.sendEmail(user.emailId, "Welcome to Swipe Rewards", message, function (error, callback) {
                        if (error) {
                            logger.warn("Failed to send Verification link to linked mail");
                            res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                        } else {
                            logger.info("Verification link sent to mail");

                            res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                                token: token,
                                name: results[0][0].name,
                                emailId: results[0][0].emailId,
                                userId: results[0][0].userId
                            }))
                        }
                    });
                    //========================================end of code for mail verification=================================================================
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
                        template.activateAccount(fullName, token, 3, function (err, msg) {
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
        sql: "select * from users where emailId = ? and password = ? and isDeleted = ?",
        values: [req.body.requestData.emailId, req.body.requestData.password, 0]
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
                        emailHandler.sendEmail(user.emailId, "Swipe Rewards, Forgot password link", message, function (error, callback) {
                            if (error) {
                                logger.warn("Failed to send Password reset link to linked mail");
                                res.send(responseGenerator.getResponse(1013, "Failed to send Password reset link to linked mail", null))
                            } else {
                                logger.info("Password reset link sent to mail");
                                res.send(responseGenerator.getResponse(200, "Success", null))
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
            if (results && results.length > 0) {
                if (req.body.requestData.emailId == results[0].emailId) {
                    var tokenCreatedDate = new Date(results[0].createdDate);
                    var currentDate = Date.now();
                    var diff = new DateDiff(currentDate, tokenCreatedDate);
                    var diffInMinutes = diff.minutes();
                    if ((diffInMinutes > 0) && (diffInMinutes < 1441)) {

                        var user = {
                            'emailId': req.body.requestData.emailId,
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
        sql: "select u.emailId, u.fullName, u.userId, u.roleId, u.isUserVerified, u.profilePicUrl, u.merchantId, mr.name as role from users u join mst_role mr on u.roleId = mr.id where u.emailId = ? and u.password = ? and u.isDeleted = ?",
        values: [req.body.requestData.emailId, req.body.requestData.password, 0]
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

    db.query('select * from users where emailId = ?', [user.emailId], function (error, results) {
        if (!error) {
            if (results.length > 0) {

                //generation of jwt token
                var token = jwt.sign(
                    {
                        emailId: results[0].emailId,
                        name: results[0].fullName,
                        userId: results[0].userId
                    }, config.privateKey, {
                        expiresIn: '1d'
                    });

                //=======================================code to send verification email on signup========================================================
                var message;
                template.welcome(user.fullName, token, function (err, msg) {
                    message = msg;
                })
                emailHandler.sendEmail(user.emailId, "Welcome to Swipe Rewards", message, function (error, callback) {
                    if (error) {
                        logger.warn("Failed to send Verification link to linked mail");
                        res.send(responseGenerator.getResponse(1001, "Failed to send Verification link to linked mail", null))
                    } else {
                        logger.info("Verification link sent to mail");

                        res.send(responseGenerator.getResponse(200, "Please click on the verification link you received in registered email", {
                            fullName: results[0].fullName,
                            emailId: results[0].emailId,
                            userId: results[0].userId
                        }))
                    }
                });
            }
            else {

            }

        }
        else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
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
    var admin = {
        "fullName": req.body.requestData.fullName,
        "emailId": req.body.requestData.emailId,
        "contactNumber": req.body.requestData.contactNumber,

    }
    Reqbody.userId = req.result.userId;
    var query = {
        sql: "select userId, fullName from users where emailId = ?",
        values: [Reqbody.requestData.entityEmail]
    };

    db.query(query, function (errorEmailCheck, resultsEmailCheck, fieldsEmailCheck) {
        if (errorEmailCheck) {
            logger.error("Error while processing your request", errorEmailCheck);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        } else {
            if (resultsEmailCheck.length == 0) {
                transaction.createMerchant(Reqbody, function (error, response) {
                    if (error) {
                        logger.info("Error while creating merchants - " + req.result.userId);
                        res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
                    }
                    else if (response) {
                        if (response.body.status == 200) {
                            logger.info("Merchant added successfully by user - " + req.result.userId);
                            var randomPassword = randomstring.generate(8);
                            var params = [response.body.responseData.fullName, response.body.responseData.email, randomPassword, "Web",
                            response.body.responseData.merchantId, response.body.responseData.entityName, response.body.responseData.entityId, response.body.responseData.accountId, response.body.responseData.memberId];
                            db.query('call CreateMerchant(?,?,?,?,?,?,?,?,?)', params, function (error, results) {
                                if (!error) {

                                    //generation of jwt token
                                    var token = jwt.sign(
                                        {
                                            emailId: results[0][0].emailId,
                                            name: results[0][0].name,
                                            userId: results[0][0].userId
                                        }, config.privateKey, {
                                            expiresIn: '365d'
                                        });
                                    //=======================================code to send verification email on signup========================================================
                                    var message;
                                    template.welcome(response.body.responseData.fullName, token, function (err, msg) {
                                        message = msg;
                                    });
                                    emailHandler.sendEmail(results[0][0].emailId, "Welcome to Swipe Rewards", message, function (errorEmailHandler) {
                                        if (errorEmailHandler) {
                                            logger.warn("Failed to send Verification link to linked mail");
                                            res.send(responseGenerator.getResponse(1001, "Merchant created successfully, Failed to send Verification link to linked mail", response.body.responseData))
                                        } else {
                                            logger.info("Verification link sent to mail");
                                            res.send(response.body);
                                        }
                                    });
                                    //========================================end of code for mail verification=================================================================

                                } else {
                                    logger.error("Error while processing your request", error);
                                    res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                                }
                            })
                        }
                        else {
                            logger.info("Create merchant - something went wrong" + req.result.userId);
                            res.send(response.body);
                        }

                    }
                });
            }
            else {
                logger.warn("Email Already Exists");
                res.send(responseGenerator.getResponse(1004, "Email Already Exists", null));
            }

        }
    });


}