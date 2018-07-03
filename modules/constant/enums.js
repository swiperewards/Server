
//this constant are referred to respective tables in database

//referred to 'role' table
var roleId = Object.freeze(
    {
        "admin": 1,
        "merchant": 2,
        "user": 3
    }
);

//referred to 'status' table
var statusId=Object.freeze({
"active":1,
"inactive":2,
"blocked":3

});


module.exports={
roleId,
statusId
}