var path =require('path');
var api=require(path.resolve('.','modules/ticket/ticketController.js'))
var express = require('express');
var router=express.Router();

router.post("/getTicketTypes", api.getTicketTypes);
router.post("/generateTicket", api.generateTicket);

module.exports=router;