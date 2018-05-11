const http = require('http');
const https = require('https');
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./plan.db', (err) =>{
  if (err) {
    console.error(err.message);
  } else console.log('Henlo from database.');
});

function pull() {

}

db.close();
