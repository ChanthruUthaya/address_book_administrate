const sqlite3 = require('sqlite3');

/*

file for database connection, uses SQLite3 for database module

schema:

CREATE TABLE organisations (
NAME varchar(255) NOT NULL UNIQUE PRIMARY KEY,
EMAIL varchar(255) NOT NULL);


CREATE TABLE people (
PID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
NAME varchar(255) NOT NULL,
LAST_NAME varchar(255) NOT NULL,
ADDRESS varchar(255) NOT NULL,
EMAIL varchar(255) NOT NULL,
PHONE varchar(255) NOT NULL,
ORGANISATION varchar(255) NOT NULL,
CONSTRAINT FK_ORGANISATION FOREIGN KEY (ORGANISATION) REFERENCES organisations (NAME) ON DELETE CASCADE);

*/

let db = new sqlite3.Database('./db/address_book.db', (err)=>{
    if(err){
        console.log(err.message);
    }
    console.log('Connected to Address_book database');
}) //database connection

module.exports = db; //export database connection for use in other files
