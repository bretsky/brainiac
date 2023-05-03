const fs = require("fs");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const userColumns = [
  "user",
  "password",
  "email"
];

const benchmarkColumns = [
  "user",
  "timestamp",
  "op",
  "l",
  "r",
  "elapsed",
  "attempts"
];

class MockDB {
  constructor() {
    let users = {}
    this.users = users;
    let benchmarks = {}
    this.benchmarks = benchmarks;
    fs.createReadStream("./users.csv")
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row) {
        users[row[0]] = {userid: row[0], password: row[1], email: row[2]};
      })
    fs.createReadStream("./benchmarks.csv")
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row) {
        if (row[0] in benchmarks) {
          benchmarks[row[0]].push(row);
        } else {
          benchmarks[row[0]] = [row];
        }
      })
  }
  getUser(userid) {
    if (userid in this.users) {
      return this.users[userid];
    } else {
      return null;
    }
  }
  createUser(userid, password, email) {
    this.users[userid] = {userid: userid, password: password, email: email};
    const writableStream = fs.createWriteStream("users.csv");
    const stringifier = stringify({ header: true, columns: userColumns });
    Object.entries(this.users).forEach(([key, value]) => {
      stringifier.write([value.userid, value.password, value.email])
    });
    stringifier.pipe(writableStream);
    return this.users[userid];
  }
  createBenchmark(userid, timestamp, op, l, r, elapsed, attempts) {
    if (!(userid in this.benchmarks)) {
      this.benchmarks[userid] = [];
    }
    this.benchmarks[userid].push([userid, timestamp, op, l, r, elapsed, attempts]);
    const writableStream = fs.createWriteStream("benchmarks.csv");
    const stringifier = stringify({ header: true, columns: benchmarkColumns });
    Object.entries(this.benchmarks).forEach(([key, value]) => {
      value.forEach((row) => {
        stringifier.write(row);
      });
    });
    stringifier.pipe(writableStream);
    return [userid, timestamp, op, l, r, elapsed, attempts];
  }
}

module.exports = MockDB;