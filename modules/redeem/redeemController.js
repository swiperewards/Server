var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var config = require(path.resolve('./', 'config'))
var logger = require(path.resolve('./logger'))
var msg = require(path.resolve('./', 'utils/errorMessages.js'))


exports.getRedeemOptions = function (req, res) {

    var token = req.headers.auth

    if (token) {
        jwt.verify(token, config.privateKey, function (err, result) {
            if (err) {
                logger.error(msg.tokenInvalid);
                res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))
            } else {
                // parameter to be passed to select redeem options
                params = [0, 0, '']
                db.query("select mrd.id as modeId, mrd.mode, mrdo.id as modeSubId, mrdo.name from mst_redeem_modes mrd left outer join mst_redeem_mode_options mrdo on mrd.id = mrdo.redeemModeId where mrd.isDeleted = ? and (mrdo.isDeleted = ? or COALESCE(mrdo.isDeleted, '') = ?)", params, function (error, results) {
                    if (!error) {
                        var arr = [];
                        for(var i = 0; i<results.length; i++){
                            var obj = {};
                            obj.modeId = results[i].modeId;
                            obj.mode = results[i].mode;
                            obj.modeOptions = [];
                            for(var j= 0; j<results.length; j++){
                                if((results[i].modeId == results[j].modeId)&&(results[j].modeSubId)){
                                    obj.modeOptions.push({"modeSubId": results[j].modeSubId, "name": results[j].name});
                                }
                            }
                            arr.push(obj);
                        }
                        var arrFinal = [];
                        for(var k= 0; k<arr.length; k++){
                            if(k == 0){
                                arrFinal.push(arr[k]);
                            } else{
                                var found = false;
                                for(var l= 0; l<arrFinal.length;l++){
                                    if(arr[k].modeId == arrFinal[l].modeId){
                                        found = true;
                                        break;
                                    }
                                    else{
                                    }
                                }
                                if(!found){
                                    arrFinal.push(arr[k]);
                                }
                            }
                        }
                        logger.info("getRedeemOptions - Redeem options fetched successfully for user - " + result.userId);
                        res.send(responseGenerator.getResponse(200, "Success", arrFinal))
                    } else {
                        logger.error("getRedeemOptions - Error while processing your request", error);
                        res.send(responseGenerator.getResponse(1005, msg.dbError, null))
                    }
                })
            }
        });
    } else {
        logger.error(msg.tokenInvalid);

        res.send(responseGenerator.getResponse(500, msg.tokenInvalid, null))

    }

}

