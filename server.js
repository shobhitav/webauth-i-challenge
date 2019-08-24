const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt=require('bcryptjs');


 const db = require('./database/dbConfig.js');
 const Users = require('./users/users-model.js');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());


server.get('/', (req, res) => {
  res.send("<h1>It's Working!<h1>");
});

//TO CREATE USER
server.post('/api/register', (req, res) => {
  let user = req.body;
const hash=bcrypt.hashSync(user.password,12) 
user.password =hash;
//without hashing if you post the data,u can see the password as a text(and not hashed psswd)
  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post('/api/login',validate, (req, res) => {
  let { username,password} = req.headers;
console.log(username,password);

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user  && bcrypt.compareSync(password,user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.get('/api/users', validate,(req, res) => {
  const {username,password}= req.headers
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
  });

function validate(req,res,next){
          const {username,password}= req.headers;
          if(username && password) {
              Users.findBy({username})
                .first()
              .then(user => {
                  if (user  && bcrypt.compareSync(password,user.password)) {
                    next()
                  }
                  else{
                    res.status(403).json({message:"invalid credentials"});
                  }

                })
                .catch(err =>{
                  res.status(500).json({message:"unexpected error:"+err});
                })
      }else{
        res.status(400).json({message:"no credentials provided"});
      }

  
}
module.exports = server;