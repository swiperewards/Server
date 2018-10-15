var path =require('path');
var api=require(path.resolve('.','modules/ticket/ticketController.js'))
var express = require('express');
var encDecController=require(path.resolve('.','modules/config/encryptDecryptController.js'))
var functions=require(path.resolve('.','utils/functions.js'));
var router=express.Router();

// api to get ticket types
router.post("/getTicketTypes", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getTicketTypes);

// api to add ticket type
router.post("/addTicketType", functions.decryptDataMiddleWare, encDecController.verifyToken, api.addTicketType);

// api to update ticket type
router.post("/updateTicketType", functions.decryptDataMiddleWare, encDecController.verifyToken, api.updateTicketType);

// api to update ticket type
router.post("/deleteTicketType", functions.decryptDataMiddleWare, encDecController.verifyToken, api.deleteTicketType);

// api to get ticket type details
router.post("/getTicketTypeDetails", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getTicketTypeDetails);

// api to generate ticket for user
router.post("/generateTicket", functions.decryptDataMiddleWare, encDecController.verifyToken, api.generateTicket);

// api to generate ticket for user
router.post("/updateTicket", functions.decryptDataMiddleWare, encDecController.verifyToken, api.updateTicket);

// api to generate ticket for user
router.post("/getTickets", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getTickets);

// api to resolve ticket for user
router.post("/resolveTicket", functions.decryptDataMiddleWare, encDecController.verifyToken, api.resolveTicket);

// api to get ticket details
router.post("/getTicketDetails", functions.decryptDataMiddleWare, encDecController.verifyToken, api.getTicketDetails);


module.exports=router;
