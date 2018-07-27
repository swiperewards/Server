var path =require('path');
var api=require(path.resolve('.','modules/ticket/ticketController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var router=express.Router();

// api to get ticket types
router.post("/getTicketTypes", encDecController.verifyToken, api.getTicketTypes);

// api to generate ticket for user
router.post("/generateTicket", encDecController.verifyToken, api.generateTicket);

module.exports=router;