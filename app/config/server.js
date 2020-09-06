require('dotenv').config();
module.exports = {
    database: process.env.DB_CONNECTION,
    secret: 'secret'
}   