var path = require('path');
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var request = require('request');

function createMerchant(ReqBody, callback) {

    request({
        url: config.transactionApiUrl + "/merchant/createMerchant",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true,
        body: ReqBody
    }, function (err, res) {
        callback(err, res);
    })

}


function getMerchants(callback) {

    request({
        url: config.transactionApiUrl + "/merchant/getMerchants",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true
    }, function (err, res) {
        callback(err, res);
    })

}


function getMerchantsWithFilter(Reqbody, callback) {

    request({
        url: config.transactionApiUrl + "/merchant/getMerchantsWithFilter",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true,
        body: Reqbody
    }, function (err, res) {
        callback(err, res);
    })

}


function getMerchantDetails(Reqbody, callback) {

    request({
        url: config.transactionApiUrl + "/merchant/getMerchantDetails",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true,
        body: Reqbody
    }, function (err, res) {
        callback(err, res);
    })

}


function deleteMerchant(Reqbody, callback) {

    request({
        url: config.transactionApiUrl + "/merchant/deleteMerchant",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true,
        body: Reqbody
    }, function (err, res) {
        callback(err, res);
    })

}


function updateMerchant(Reqbody, callback) {

    if (Reqbody.requestData.isRecordUpdated == "1") {
        request({
            url: config.transactionApiUrl + "/merchant/updateMerchant",
            method: 'POST',
            headers:
                {
                    'Content-Type': 'application/json'
                },
            json: true,
            body: Reqbody
        }, function (err, res) {
            callback(err, res);
        })
    }
    else {
        var body = { "status": 201, "message": "No change in merchant data", "responseData": null };
        callback(null, { "status": 201, "message": "No change in merchant data", "responseData": null, body })
    }

}


function updateEntity(Reqbody, callback) {
    if (Reqbody.requestData.isRecordUpdated == "1") {
        request({
            url: config.transactionApiUrl + "/entity/updateEntity",
            method: 'POST',
            headers:
                {
                    'Content-Type': 'application/json'
                },
            json: true,
            body: Reqbody
        }, function (err, res) {
            callback(err, res);
        })
    }
    else {
        var body = { "status": 201, "message": "No change in entity data", "responseData": null };
        callback(null, { "status": 201, "message": "No change in entity data", "responseData": null, body })
    }



}



function createMember(Reqbody, callback) {

    request({
        url: config.transactionApiUrl + "/member/createMember",
        method: 'POST',
        headers:
            {
                'Content-Type': 'application/json'
            },
        json: true,
        body: Reqbody
    }, function (err, res) {
        callback(err, res);
    })

}


function updateMember(Reqbody, callback) {
    if (Reqbody.requestData.isRecordUpdated == "1") {
        request({
            url: config.transactionApiUrl + "/member/updateMember",
            method: 'POST',
            headers:
                {
                    'Content-Type': 'application/json'
                },
            json: true,
            body: Reqbody
        }, function (err, res) {
            callback(err, res);
        })
    }
    else {
        body = { "status": 201, "message": "No change in member data", "responseData": null };
        callback(null, { "status": 201, "message": "No change in member data", "responseData": null, body })
    }

}



function updateAccount(Reqbody, callback) {

    if (Reqbody.requestData.isRecordUpdated == "1") {
        request({
            url: config.transactionApiUrl + "/account/updateAccount",
            method: 'POST',
            headers:
                {
                    'Content-Type': 'application/json'
                },
            json: true,
            body: Reqbody
        }, function (err, res) {
            callback(err, res);
        })
    }
    else {
        body = { "status": 201, "message": "No change in account", "responseData": null }
        callback(null, { "status": 201, "message": "No change in account", "responseData": null, body })
    }
}



// if (Reqbody.isRecordUpdated == "1") {
// }
// else {
//     callback(null, { "status": 201, "message": "No change" })
// }




module.exports = {
    createMerchant: createMerchant,
    getMerchants: getMerchants,
    getMerchantsWithFilter: getMerchantsWithFilter,
    getMerchantDetails: getMerchantDetails,
    deleteMerchant: deleteMerchant,
    updateMerchant: updateMerchant,
    updateEntity: updateEntity,
    createMember: createMember,
    updateMember: updateMember,
    updateAccount: updateAccount
}

