const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_IP, // Your database host 
    port: process.env.DB_PORT,     
    user: process.env.DB_USERNAME,            
    password: process.env.DB_PASSWORD,    // Your MySQL password
    database: process.env.DB_DATABASE,      // Your database name
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
