var path =require('path');
var api=require(path.resolve('.','modules/ticket/ticketController.js'))
var express = require('express');
var router=express.Router();

// api to get ticket types
router.post("/getTicketTypes", api.getTicketTypes);

// api to generate ticket for user
router.post("/generateTicket", api.generateTicket);

module.exports=router;