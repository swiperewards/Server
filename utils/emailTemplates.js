
var path = require('path');
var fs = require('fs');
var config = require(path.resolve('./', 'config'))


exports.welcome = function (username, token, callback) {
  link = config.frontEndHost + "/#/activateAccount/" + token;
  var template = fs.readFileSync('./static/welcome.html', 'utf8').toString();
  template = template.replace("$username", username).replace("$link", link)
  callback(null, template)
}

exports.activateAccount = function (username, token, roleId, callback) {
  if(roleId == 3){
    link = config.frontEndHost + "/#/activateAccount/" + token;
    var template = fs.readFileSync('./static/activateAccountMerchant.html', 'utf8').toString();
    template = template.replace("$username", username).replace("$link", link)
    callback(null, template)
  }
  else {
    callback(null, null);
  }
}

exports.forgotPassword = function (fullname, token, callback) {
  link = config.frontEndHost + "/#/forgotPassword/" + token;
  var template = fs.readFileSync('./static/forgotPassword.html', 'utf8').toString();
  template = template.replace("$fullname", fullname).replace("$link", link).replace("$token", token);
  callback(null, template)
}