var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))
var cron = require('node-cron');

cron.schedule('0 0 * * * *', function () {
    db.query("select 1", function (error, results) {
        logger.info("configController - keep alive (mysql)- " + new Date(Date.now()));
    });
});

exports.initSwipe = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);

                res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
            } else {
                /* check whether appVersionCode is supported or not and 
                   set isForcedUpdate true, if appVersionCode is not supported */
                var isForcedUpdate = (req.body.requestData.platform == "Android"
                    && req.body.requestData.appVersionCode < config.minSupportedAndroidAppVersionCode) ||
                    (req.body.requestData.platform == "IOS"
                        && req.body.requestData.appVersionCode < config.minSupportedIosAppVersionCode)

                var configData = {
                    "platform": req.body.requestData.platform,
                    "isForcedUpdate": isForcedUpdate,
                    "playStoreURL": config.playStoreURL,
                    "privacySecurityUrl": config.privacySecurityUrl,
                    "termsOfUseUrl": config.termsOfUseUrl,
                    "currentTimeStamp": Date.now(),
                    "maxRedeemCashBack": config.maxRedeemCashBack
                };
                // parameter to be passed to select deals query
                params = [0, result.userId, 0];
                db.query("select u.userId, u.fullName, u.city, u.latitude, u.longitude, u.userLevel, ml.description, u.isNotificationEnabled, u.profilePicUrl from users u join mst_level ml on u.userLevel between ml.minRange and ml.maxRange where u.isDeleted = ? and u.userId = ? and ml.isDeleted = ?", params, function (error, results) {
                    if (!error) {
                        var userData = {
                            "userId": results[0].userId,
                            "fullName": results[0].fullName,
                            "city": results[0].city,
                            "latitude": results[0].latitude,
                            "longitude": results[0].longitude,
                            "userLevel": results[0].userLevel,
                            "levelValue": results[0].levelValue,
                            "isNotificationEnabled": results[0].isNotificationEnabled ? true : false,
                            "profilePicUrl": results[0].profilePicUrl
                        }
                        logger.info("initSwipe - userData fetched successfully by user - " + result.userId);
                        res.send(responseGenerator.getResponse(200, "Success", { "generalSettings": configData, "userProfile": userData }))
                    } else {
                        logger.error("initSwipe - Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
        });
    } else {
        var configData = {
            "isForcedUpdate": (req.body.requestData.appVersionCode >= config.appVersionCode) ? false : true,
            "playStoreURL": config.playStoreURL
        };

        logger.error("initSwipe - without auth");
        res.send(responseGenerator.getResponse(200, "Success", { "generalSettings": configData }));

    }

}
