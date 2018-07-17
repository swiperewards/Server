var path = require('path');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var nodeMailer = require('nodemailer');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var emailHandler = require(path.resolve('./', 'utils/emailHandler.js'));
var template = require(path.resolve('./', 'utils/emailTemplates.js'))

exports.registerUser = function (req, res) {

    var user = {
        'fullName': req.body.requestData.fullName,
        'mobileNumber': req.body.requestData.mobileNumber,
        'emailId': req.body.requestData.emailId,
        'password': req.body.requestData.password,
        'platformId': req.body.platformId,
        'deviceId': req.body.deviceId,
        'lat': req.body.requestData.lat,
        'long': req.body.requestData.long,
        'pincode': req.body.requestData.pincode,
        'city': req.body.requestData.city,
        'isSocialLogin': req.body.requestData.isSocialLogin,
        'profilePicUrl': !req.body.requestData.isSocialLogin ? null : req.body.requestData.profilePicUrl,
        'socialToken': !req.body.requestData.isSocialLogin ? null : req.body.requestData.socialToken,
        'referralCode': !req.body.requestData.referralCode ? null : req.body.requestData.referralCode
    }

    db.query('call SignupUser("' + user.fullName + '","' + user.mobileNumber + '","' + user.emailId+ '","' + user.password + '","' + user.platformId + '","' + user.deviceId + '","' + user.lat + '","' + user.long + '","' + user.pincode + '","' + user.city + '","' + user.isSocialLogin + '","' + user.profilePicUrl + '","' + user.socialToken + '","' + user.referalCode + '")', function (error, results) {
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
                    data, config.privateKey, {
                        expiresIn: 3600
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
                            email_id: results[0][0].emailId,
                            user_id: results[0][0].userId
                        }))
                    }
                });
                //========================================end of code for mail verification=================================================================
            }
        } else {
            logger.error("Error while processing your request", error);
            res.send(responseGenerator.getResponse(1005, "Error while processing your request", null))
        }
    })
}



exports.loginUser = function (req, res) {

    var strQuery = {
        sql: "select * from users where emailId = ? and password = ?",
        values: [req.body.requestData.emailId, req.body.requestData.password]
    };

    db.query(strQuery, function (error, results, fields) {
        if (error) {
            console.log(error)
            finalCallback("Please check username or password", results)
        } else {
            if (results && results.length > 0) {
                var data = {
                    emailId: results[0].emailId,
                    name: results[0].name,
                    userId: results[0].userId
                }
                //generation of jwt token
                var token = jwt.sign(
                    data, config.privateKey, {
                        expiresIn: 3600
                    });
                // finalCallback(null, results)
                if(!results[0].is_user_verified){
                    res.send(responseGenerator.getResponse(200, "Login successfull", {
                        token: token,
                        name: results[0].name,
                        emailId: results[0].emailId,
                        userId: results[0].userId
                    })) 
                }
                else{
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

