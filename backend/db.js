const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',       // Your database host
    user: 'u513798782_relife',            // Your MySQL username
    password: '>9jS+B|z',    // Your MySQL password
    database: 'u513798782_relife',      // Your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
