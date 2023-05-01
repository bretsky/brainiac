const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const bcrypt = require("bcrypt");
const MockDB = require("./mockdb");
const mockdb = new MockDB();
let db = mockdb;

app.post('/signup', (req, res) => {
    try {
        console.log(req.body);
        const {userid, password, email} = req.body;
        if (userid == null || userid == "" || userid.length > 32) {
            return res.status(400).send({message: "Invalid username"});
        }
        if (password == null || password == "" || password.length < 6) {
            return res.status(400).send({message: "Invalid password"});
        }
        if (email == null || email.length < 3 || email.indexOf("@") < 1 || email.indexOf("@") == email.length - 1) {
            return res.status(400).send({message: "Invalid email"});
        }

        let user = db.getUser(userid);
        if (user != null) {
            res.status(401).json({message: "User already exists"});
            return;
        }

        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) throw new Error("Internal Server Error");

            let newUser = db.createUser(userid, hash, email);
            res.json({ message: "User created successfully", user: userid });
        })
    } catch (err) {
        return res.status(401).send(err.message);
    }
    
})


io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(1999, () => {
  console.log('listening on *:1999');
});