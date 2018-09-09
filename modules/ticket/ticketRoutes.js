var path =require('path');
var api=require(path.resolve('.','modules/ticket/ticketController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var router=express.Router();

// api to get ticket types
router.post("/getTicketTypes", encDecController.verifyToken, api.getTicketTypes);

// api to add ticket type
router.post("/addTicketType", encDecController.verifyToken, api.addTicketType);

// api to update ticket type
router.post("/updateTicketType", encDecController.verifyToken, api.updateTicketType);

// api to update ticket type
router.post("/deleteTicketType", encDecController.verifyToken, api.deleteTicketType);

// api to get ticket types
router.post("/getTicketDetails", encDecController.verifyToken, api.getTicketDetails);

// api to generate ticket for user
router.post("/generateTicket", encDecController.verifyToken, api.generateTicket);

// api to generate ticket for user
router.post("/updateTicket", encDecController.verifyToken, api.updateTicket);

module.exports=router;