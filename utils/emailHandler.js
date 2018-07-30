var nodemailer = require('nodemailer');
var path = require('path');
var config = require(path.resolve('./', 'config'))

exports.sendEmail = function (to, subject, message, callback) {

    var status = sendEmail(to, subject, message, callback);
}


function sendEmail(to, subject, message, callback) {
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: '587',
        auth: {
            user: config.emailAccountUserName,
            pass: config.emailAccountPassword
        }

    });

    var mailOptions = {
        from: config.emailAccountUserName,
        to: to,
        subject: subject,
        html: message

    };

    transporter.sendMail(mailOptions, function (err, info) {

        if (err) {

            console.log("sending email error:" + err);
        }
        if (callback) {

            callback(err, info);
        }

    })

}