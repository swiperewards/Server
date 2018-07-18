exports.getResponse = function (status, msg, data) {

    var response = {
        "status": status,
        "message": msg,
        "responseData": data
    }
    return response;
}