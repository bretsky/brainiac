require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const cors = require('cors');
app.use(cors({
    origin: process.env.FRONTEND_HOST
}));
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONTEND_HOST,
    methods: ["GET", "POST"]
  }
});
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");


let db;
if (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRES_DEV === 'true') {
    const DB = require("./db");
    db = new DB(
        process.env.PG_USER,
        process.env.PG_URL,
        process.env.PG_DATABASE,
        process.env.PG_PASSWORD,
        process.env.PG_PORT
    );
    db.init();
} else {
    const MockDB = require("./mockdb");
    db = new MockDB();
}


const {randomChoice, randAdd, randSub, randMul, randDiv} = require('./quiz');

const ops = {
    '+': randAdd,
    '-': randSub,
    '*': randMul,
    '/': randDiv,
}

let hasAuth = {};
let users = {};
let configs = {};

app.post('/signup', async (req, res) => {
    try {
        console.log(req.body);
        const {userid, password, email} = req.body;
        if (userid == null || userid == "" || userid.length > 32) {
            console.log("Invalid username");
            return res.status(400).json({message: "Invalid username"});
        }
        if (password == null || password == "" || password.length < 6) {
            console.log("Invalid password");
            return res.status(400).json({message: "Invalid password"});
        }
        if (email == null || email.length < 3 || email.indexOf("@") < 1 || email.indexOf("@") == email.length - 1) {
            console.log("Invalid email");
            return res.status(400).json({message: "Invalid email"});
        }

        let user = await db.getUser(userid);
        if (user != null) {
            res.status(401).json({message: "User already exists"});
            return;
        }

        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) throw new Error("Internal Server Error");

            let newUser = await db.createUser(userid, hash, email);
            if (newUser != null) {
                res.json({ message: "User created successfully", user: userid });
            } else {
                res.status(500).json({message: "Couldn't create user"});
            }
        });
    } catch (err) {
        return res.status(401).json({message: err.message});
    }
    
});

app.post('/login', async (req, res) => {
    try {
        const {userid, password} = req.body;
        console.log(req.body);
        let user = await db.getUser(userid);
        if (user == null) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                const token = jwt.sign({sub: userid}, process.env.SECRET_KEY, { expiresIn: '7d' });
                // res.cookie('token', token, { httpOnly: true });
                return res.status(200).json({ message: "User Logged in Successfully", userid: userid, token: token });
            }

            console.log(err);
            return res.status(401).json({ message: "Invalid Credentials" });
        });
    } catch (err) {
        return res.status(401).json({message: err.message});
    }
})

const nextQuestion = (socket, userid, config) => {
    let activeOps = config.ops || Object.keys(ops);
    let opsToDigits = config.digits || {'+': 3, '-': 3, '*': 2, '/': 2};
    let op = randomChoice(activeOps);
    let question = ops[op]({digits: opsToDigits[op]});
    socket.emit('question', {question: question.str})
    return {sent: Date.now(), ping: null, attempts: 0, question: question};
}


io.on('connection', (socket) => {
  console.log('a user connected');
  hasAuth[socket.id] = false;
  const authTimeout = setTimeout(() => {
    socket.emit('error', {error: 'auth timeout'});
    socket.disconnect();
  }, 5000);

  socket.on('disconnect', () => {
    delete hasAuth[socket]
    console.log('user disconnected');
  });

  socket.on('auth', (data) => {
    console.log(data);
    let {userid, token} = data;
    jwt.verify(token, process.env.SECRET_KEY, { subject: userid }, function(err, decoded) {
        clearTimeout(authTimeout);
        if (err) {
            console.log(err.message)
            socket.emit('error', {error: "invalid credentials"});
            socket.disconnect();
        } else {
            console.log(decoded)
            hasAuth[socket.id] = true;
            socket.emit('auth', decoded);
        }
    });
  });

  socket.on('start', (data) => {
    let config = data.config || {};
    let {userid} = data;
    users[userid] = nextQuestion(socket, userid, config);
    configs[userid] = config;
  });

  socket.on('ping', (data) => {
    let {userid} = data;
    if (!(userid in users)) {
        socket.emit('error', {error: "invalid user"});
        return;
    }
    users[userid].ping = Date.now() - users[userid].sent;
    console.log(users);
  });

  socket.on('answer', async (data) => {
    let {answer, userid} = data;
    if (!(userid in users)) {
        socket.emit('error', {error: "invalid user"});
        return;
    }
    users[userid].attempts++;
    if (Number(answer) === users[userid].question.result) {
        const elapsed = Date.now() - users[userid].sent - users[userid].ping;
        await db.createBenchmark(userid, users[userid].sent, users[userid].question.op, users[userid].question.l, users[userid].question.r, elapsed, users[userid].attempts);
        users[userid] = nextQuestion(socket, userid, configs[userid]);
    } else {
        console.log(Number(answer))
        console.log('!=')
        console.log(users[userid].question.result)
    }
    console.log(users);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`listening on *:${process.env.PORT}`);
});