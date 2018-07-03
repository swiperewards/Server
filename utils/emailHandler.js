var nodemailer = require('nodemailer');
var path = require('path');

exports.sendEmail = function (to, subject, message, callback) {

    var status = sendEmail(to, subject, message,callback);
}


// function sendEmail(to, subject, message, callback) {
//     var transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: '587',
//         auth: {
//             user: 'testid.android@gmail.com',
//             pass: 'winjit123'
//         },
//         secureConnection: 'false',
//         tls: {
//             ciphers: 'SSLv3'
//         }

//     });


function sendEmail(to, subject, message, callback) {
    var transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: '587',
        auth: {
            user: 'adnans@winjit.com',
            pass: 'Adnan@2019'
        },
        secureConnection: 'false',
        tls: {
            ciphers: 'SSLv3'
        }

    });

    var mailOptions = {
       // from: 'testid.android@gmail.com',
       from: 'adnans@winjit.com',
        to: to,
        subject: subject,
        html: message

    };

    transporter.sendMail(mailOptions, function (err, info) {

        if(err){
            console.log("sending email error:"+err);
        }
        if(callback){
            callback(err, info);
            console.log("email sent successfully");
        }
       
    })

}