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
var fs = require("fs");

/*
Codes used :
1001 Failed to send Verification link to linked mail
1004 Email Already Exists
1005 db error
1002 Verification pending
1003 Please check username or password
500 invalid token
1006 Entered wrong old password
1007 Please send profile image file
1008 Error while uploading file
*/

exports.registerUser = function (req, res) {

    var user = {
        'fullName': req.body.requestData.fullName,
        'mobileNumber': !req.body.requestData.mobileNumber ? null : req.body.requestData.mobileNumber,
        'emailId': req.body.requestData.emailId,
        'password': req.body.requestData.password,
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
    db.query('call SignupUser(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results) {
        if (!error) {
            //check for email already exists in DB
            if (results[0][0].IsNewRecord == 1) {
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
    var ProfilePicImage = null;
    var imgName = null;

    if (!req.files.file) {
        logger.error("updateProfilePic - no file received from " + req.result.userId);
        res.send(responseGenerator.getResponse(1007, "Please send profile image file", null))
    }
    else {
        ProfilePicImage = req.files.file;
        imgName = "uid" + req.result.userId + "-" + ProfilePicImage.name;
        imgName = imgName.replace(/\s/g, '');
        ProfilePicUrl = "./public/ProfileImages/" + imgName;


        if (Object.keys(req.files).length == 1) {
            var newFile = fs.readFileSync(req.files.file.path);
            writeFile();

            function writeFile() {
                fs.writeFile(ProfilePicUrl, newFile, function (err) {
                    if (err) {
                        logger.error("updateProfilePic - error while uploading file " + req.result.userId);
                        res.send(responseGenerator.getResponse(1008, "Error while uploading file", null))
                    } else {
                        // parameter to be passed to update password
                        params = [ProfilePicUrl, user.userId]
                        db.query("update users set profilePicUrl = ? where userId = ?", params, function (error, results) {
                            if (!error) {
                                logger.info("updateProfilePic - Profile pic updated for user - " + user.userId);
                                res.send(responseGenerator.getResponse(200, "Success", { "imagePath": config.localhost + "/user/profilepic/" + imgName }))

                            } else {
                                logger.error("updateProfilePic - Error while processing your request", error);
                                res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                            }
                        })
                    }
                })
            }
        }
    }
}


// Web api's below


exports.loginUserWeb = function (req, res) {

    var strQuery = {
        sql: "select u.emailId, u.fullName, u.userId, u.roleId, u.isUserVerified, u.profilePicUrl, mr.name as role from users u join mst_role mr on u.roleId = mr.id where u.emailId = ? and u.password = ? and u.isDeleted = ?",
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
                                menuList: resultsPrivileges,
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


exports.registerUserWeb = function (req, res) {

    var user = {
        'fullName': req.body.requestData.fullName,
        'emailId': req.body.requestData.emailId,
        'password': req.body.requestData.password,
        'platform': req.body.platform,
        'roleId': req.body.requestData.roleId
    }

    db.query('call SignupUserWeb(?,?,?,?,?)', [user.fullName, user.emailId, user.password, user.platform, user.roleId], function (error, results) {
        if (!error) {
            //check for email already exists in DB
            if (results[0][0].IsNewRecord == 1) {
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
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, msg.dbError, null))
        }
    })
}

