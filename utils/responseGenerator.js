exports.getResponse = function (status, msg, data) {

    var response = {
        "status": status,
        "message": msg,
        "response_data": data
    }
    return response;
}