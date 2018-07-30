
var path = require('path');
var fs = require('fs');
var config = require(path.resolve('./', 'config'))


exports.welcome = function (username, token, callback) {
  link = config.frontEndHost + "/#/activateAccount/" + token;
  var template = fs.readFileSync('./static/welcome.html', 'utf8').toString();
  template = template.replace("$username", username).replace("$link", link)
  callback(null, template)
}
