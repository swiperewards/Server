var winston = require('winston');

var logger = winston.createLogger({
    transports: [
        new (winston.transports.Console)(),
        new(winston.transports.File)({
            filename:'logger.log',
            handleExceptions: true,
            prettyPrint:true
        })
    ],exitOnError:false
});
logger.info('Created logger');


module.exports=logger;