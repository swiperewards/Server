

exports.ForgotPassword = function (password) {
    var template = '<font size="5">You are receiving this because you (or someone else) have requested for forgot password.<br />Your Password is : ' + password + '</font>';
    return template;

}



exports.SuccessfulPasswordChanged = function () {

    var template = 'Success!Your password has been changed';
    return template;

}


exports.WelcomeMessage = function () {

    var template = '<img src="http://www.free-icons-download.net/images/music-icon-66405.png" alt="MusicPitch" style="width:300px;height:180px;">'
+'<h1>Discover. Book. Go Live!!!</h1>'
+'<font color="blue" size="5"><p>Welcome to MusicPitch</p></font>';

    return template;

}


exports.BookedMessage = function (EventName) {

    var template = '<img src="http://www.free-icons-download.net/images/music-icon-66405.png" alt="MusicPitch" style="width:300px;height:180px;">'
+'<h1>'+EventName+'</h1>'
+'<font color="blue" size="5"><p>Congratulations!!! Your event booking is confirmed.</p></font>';

    return template;

}



exports.EventAcceptRejectMessage = function (EventName,status) {

    var template = '<img src="http://www.free-icons-download.net/images/music-icon-66405.png" alt="MusicPitch" style="width:300px;height:180px;">'
+'<h1>'+EventName+'</h1>'
+'<font color="blue" size="5"><p>Your event booking is '+status+'.</p></font>';

    return template;

}