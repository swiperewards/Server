
var path = require('path');
var fs = require('fs');
var config = require(path.resolve('./', 'config'))


exports.welcome = function (username, token, callback) {
  link = config.frontEndHost + "/#/activateAccount/" + token;
  var template = fs.readFileSync('./static/welcome.html', 'utf8').toString();
  template = template.replace("$username", username).replace("$link", link)
  callback(null, template)
}

exports.activateAccount = function (username, token, roleId, password, callback) {
  if (roleId == 4) {
    if (password) {

    }
    else {
      link = config.frontEndHost + "/#/activateAccount/" + token;
      var template = fs.readFileSync('./static/activateAccountUser.html', 'utf8').toString();
      template = template.replace("$link", link)
      callback(null, template)
    }
  }
  else if (roleId == 3) {
    if (password) {
      link = config.frontEndHost + "/#/activateAccount/" + token;
      var template = fs.readFileSync('./static/activateAccountMerchantWithPassword.html', 'utf8').toString();
      template = template.replace("$username", username).replace("$link", link).replace("$password", password);
      callback(null, template)
    }
    else {
      link = config.frontEndHost + "/#/activateAccount/" + token;
      var template = fs.readFileSync('./static/activateAccountMerchant.html', 'utf8').toString();
      template = template.replace("$username", username).replace("$link", link)
      callback(null, template)
    }
  }
  else if (roleId == 2) {
    link = config.frontEndHost + "/#/activateAccount/" + token;
    var template = fs.readFileSync('./static/activateAccountAdmin.html', 'utf8').toString();
    template = template.replace("$username", username).replace("$link", link).replace("$password", password);
    callback(null, template)
  }
  else {
    callback(null, null);
  }
}

exports.forgotPassword = function (fullname, token, callback) {
  link = config.frontEndHost + "/#/setPassword/" + token;
  var template = fs.readFileSync('./static/forgotPassword.html', 'utf8').toString();
  template = template.replace("$fullname", fullname).replace("$link", link).replace("$token", token);
  callback(null, template)
}