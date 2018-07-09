exports.getResponse = function (success, msg,data) {
    
     var response={ 
            "success":success,
            "message" :msg,
            "data":data
     }
    return response;
    }