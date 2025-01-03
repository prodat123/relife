const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
    host: '46.202.197.83', // Your database host 
    port: 3306,     
    user: 'u513798782_relife',            
    password: '>9jS+B|z',    // Your MySQL password
    database: 'u513798782_relife',      // Your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Successfully connected to the MySQL database');
    connection.release();
});

module.exports = pool;
