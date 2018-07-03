var mysql = require('mysql');

var db_config = {
    host: "localhost",
    user: "root",
    password: "",
    database: "swipe_rewards",
    multipleStatements: true
}

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.
    connection.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } else { console.log('Connection established'); }                                    // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        handleDisconnect();
    });
}

handleDisconnect();


module.exports = connection;