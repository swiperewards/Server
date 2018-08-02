var path = require('path');
var db = require(path.resolve('.', 'modules/database/databaseConnector.js'));
var splash = require(path.resolve('.', 'modules/splash/splashController.js'));
var enums = require(path.resolve('.', 'modules/constant/enums.js'));
var jwt = require('jsonwebtoken');
var responseGenerator = require(path.resolve('.', 'utils/responseGenerator.js'));
var config = require(path.resolve('./', 'config'));
var logger = require(path.resolve('./logger'));
var msg = require(path.resolve('./', 'utils/errorMessages.js'));


exports.getMerchants = function (req, res) {
    splash.getMerchants(function (error, response) {
        if (error) {
            logger.info("Error while fetching merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchant fetched successfully by user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Merchant fetched successfully", response.body));
        }
    });
}


exports.createMerchant = function (req, res) {
    Reqbody = {
        new: req.body.requestData.new,
        established: req.body.requestData.established,
        annualCCSales: req.body.requestData.annualCCSales,
        mcc: req.body.requestData.mcc,
        status: req.body.requestData.status,
        'entity[login]': req.body.requestData.entityLogin,
        'entity[type]': req.body.requestData.entityType,
        'entity[name]': req.body.requestData.entityName,
        'entity[address1]': req.body.requestData.entityAddress1,
        'entity[city]': req.body.requestData.entityCity,
        'entity[state]': req.body.requestData.entityState,
        'entity[zip]': req.body.requestData.entityZip,
        'entity[country]': req.body.requestData.entityCountry,
        'entity[phone]': req.body.requestData.entityPhone,
        'entity[email]': req.body.requestData.entityEmail,
        'entity[ein]': req.body.requestData.entityEin,
        'entity[public]': req.body.requestData.entityPublic,
        'entity[website]': req.body.requestData.entityWebsite
    }
    for (i = 0; i < req.body.requestData.entityaccounts.length; i++) {
        Reqbody["entity[accounts][" + i + "][primary]"] = req.body.requestData.entityaccounts[i].primary;
        Reqbody["entity[accounts][" + i + "][account][method]"] = req.body.requestData.entityaccounts[i].accountMethod;
        Reqbody["entity[accounts][" + i + "][account][number]"] = req.body.requestData.entityaccounts[i].accountNumber;
        Reqbody["entity[accounts][" + i + "][account][routing]"] = req.body.requestData.entityaccounts[i].accountRouting;
    }
    for (j = 0; j < req.body.requestData.members.length; J++) {
        Reqbody["members[" + j + "][title]"] = req.body.requestData.members[j].title;
        Reqbody["members[" + j + "][first]"] = req.body.requestData.members[j].first;
        Reqbody["members[" + j + "][last]"] = req.body.requestData.members[j].last;
        Reqbody["members[" + j + "][dob]"] = req.body.requestData.members[j].dob;
        Reqbody["members[" + j + "][ownership]"] = req.body.requestData.members[j].ownership;
        Reqbody["members[" + j + "][email]"] = req.body.requestData.members[j].email;
        Reqbody["members[" + j + "][ssn]"] = req.body.requestData.members[j].ssn;
        Reqbody["members[" + j + "][address1]"] = req.body.requestData.members[j].address1;
        Reqbody["members[" + j + "][address2]"] = req.body.requestData.members[j].address2;
        Reqbody["members[" + j + "][city]"] = req.body.requestData.members[j].city;
        Reqbody["members[" + j + "][state]"] = req.body.requestData.members[j].state;
        Reqbody["members[" + j + "][zip]"] = req.body.requestData.members[j].zip;
        Reqbody["members[" + j + "][country]"] = req.body.requestData.members[j].country;
        Reqbody["members[" + j + "][timezone]"] = req.body.requestData.members[j].timezone;
        Reqbody["members[" + j + "][dl]"] = req.body.requestData.members[j].dl;
        Reqbody["members[" + j + "][dlstate]"] = req.body.requestData.members[j].dlstate;
        Reqbody["members[" + j + "][primary]"] = req.body.requestData.members[j].primary;
    }
    splash.createMerchant(Reqbody, function (error, response) {
        if (error) {
            logger.info("Error while creating merchants - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Error while fetching merchants", error));
        }
        else if (response) {
            logger.info("Merchant added successfully by user - " + req.result.userId);
            res.send(responseGenerator.getResponse(200, "Merchant created successfully", response.body));
        }
    });
}

