const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/user.db", (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
});
db.run(
  "CREATE TABLE IF NOT EXISTS user(id INTEGER PRIMARY KEY AUTOINCREMENT, first_name VARCHAR(100),last_name VARCHAR(100),email VARCHAR(100),password VARCHAR(80),salt text,created_at text,updated_at text)",
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Table is created");
    }
  }
);

module.exports = db;
