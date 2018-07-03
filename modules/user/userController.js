var path = require('path');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'))
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));



exports.registerUser = function (req, res) {

    var finalCallback = function (err, result) {

        if (err) {

            res.send(responseGenerator.getResponse(false, err, null));
        } else {

            res.send(responseGenerator.getResponse(true, "User registered successfully", result))
        }
    }

    //check for mandatory field with respect to role
    if (req.body.role_id === enums.roleId.user) {

        if (!req.body.fullname || !req.body.email) {
            finalCallback("Please fill all the required fields", null)
            return
        }

    } else if (req.body.role_id === enums.roleId.merchant) {

        if (!req.body.brandname || !req.body.email) {
            finalCallback("Please fill all the required fields", null)
            return
        }
    } else {

        if (!req.body.email) {
            finalCallback("Please fill all the required fields", null)
            return
        }
    }

    var user = {
        'fullname': req.body.fullname,
        'email': req.body.email,
        'password': req.body.password,
        'contanct_number': req.body.contanct_number,
        'role_id': req.body.role_id,
        'status': req.body.status,
        'description': !req.body.description ? null : req.body.description,
        'website': req.body.website ? null : req.body.website,
        //'level': req.body.fullname,
       // 'experience_point': req.body.fullname,
        'payment_processing_fee': !req.body.payment_processing_fee ? 0 : req.body.payment_processing_fee,
        'merchant_contribution': !req.body.merchant_contribution ? 0 : req.body.merchant_contribution,
        'is_social_login': !req.body.is_social_login ? 0 : req.body.is_social_login,
      //  'is_email_verified': false,
        'city': !req.body.city ? null : req.body.city,
        'zipcode': !req.body.zipcode ? null : req.body.zipcode,
       // 'profile_pic_link': req.body.fullname,
      //  'notification_enabled': req.body.fullname,
        'my_referral_code': !req.body.my_referral_code ? null : req.body.my_referral_code,
        'referred_by_code': !req.body.referred_by_code ? null : req.body.referred_by_code,
       // 'created_at': req.body.created_at,
        //'updated_at': req.body.updated_at,
       // 'created_by': req.body.created_by,
       // 'updated_by': req.body.updated_by,
    }
  
    db.query("insert into trn_user set ?",user, function (error, results, fields) {
        if (error) {
            console.log(error)
            finalCallback("Unable to register user", null)
        } else {
            if (results) {
                finalCallback(null, results)
            }
            else {
                finalCallback("Unable to register user", null)
            }
        }
    });

}


exports.loginUser = function (req, res) {

    var finalCallback = function (err, result) {

        if (err) {
            res.send(responseGenerator.getResponse(false, err, null));
        } else {

            res.send(responseGenerator.getResponse(true, "Login Successful", result))
        }
    }

    
    var strQuery = {
        sql: "select * from trn_user where email=? and password=?",
        values: [req.body.email,req.body.password]
    };
  
    db.query(strQuery, function (error, results, fields) {
        if (error) {
            console.log(error)
            finalCallback("Please check username or password", results)
        } else {
            if (results&& results.length>0) {
                finalCallback(null, results)
            }
            else {
                finalCallback("Please check username or password", null)
            }
        }
    });

}
