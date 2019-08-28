const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt=require('bcryptjs');
const session=require('express-session');
 const knexSessionStore=require('connect-session-knex')(session);



 const db = require('./database/dbConfig.js');
 const Users = require('./users/users-model.js');

 //session configuration
const sessionOptions ={
  name:'my cookie',
  secret:'cookiesareyumyum', //is a key,for encryption 
  cookie:{
    maxAge:1000*60*60,  //how long the session good for ,in milliseconds
    secure:false,    //true for production,false for development
    httpOnly:true,   //client JS has no acess to the cookie
  },
  resave:false,
  saveUninitialized:false,//for some EU regulation
  store:new knexSessionStore ({
    knex: require('./database/dbConfig.js'),
   tablename:'sessions',
   sidFieldName:'  sidFieldName',
   createTable:true, //make table for session
   clearInterval:1000*60*60
  })
}


const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionOptions)); 

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


// LOGIN USING HASHING
// server.post('/api/login',validate, (req, res) => {
//   let { username,password} = req.headers;
// console.log(username,password);

//   Users.findBy({ username })
//     .first()
//     .then(user => {
//       if (user  && bcrypt.compareSync(password,user.password)) {
//         res.status(200).json({ message: `Welcome ${user.username}!` });
//       } else {
//         res.status(401).json({ message: 'Invalid Credentials' });
//       }
//     })
//     .catch(error => {
//       res.status(500).json(error);
//     });
// });


// LOGIN USING SESSIONS
server.post('/api/login', (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
      
    
         req.session.user=user;  //user obj is set in session only on sucessful login
        res.status(200).json({
          message: `Welcome ${user.username}! have a cookie`,
        });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});



// GET/USERS
server.get('/api/users', validate,(req, res) => {
  const {username,password}= req.headers
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
  });
 

  //>>>>>>>>>>>validating with headers in the validate middleware >>>>>>>.
// function validate(req,res,next){
//           const {username,password}= req.headers;
//           if(username && password) {
//               Users.findBy({username})
//                 .first()
//               .then(user => {
//                   if (user  && bcrypt.compareSync(password,user.password)) {
//                     next()
//                   }
//                   else{
//                     res.status(403).json({message:"invalid credentials"});
//                   }

//                 })
//                 .catch(err =>{
//                   res.status(500).json({message:"unexpected error:"+err});
//                 })
//       }else{
//         res.status(400).json({message:"no credentials provided"});
//       }

  
// }


//>>>>>>>>>>>>>>> validating with sessions   >>>>>>>>>>
function validate(req, res, next) {
     if (req.session && req.session.user) {  
      if(req.session){
        console.log(req.session)
      }
        next()
   }
   else {
      res.status(401).json({ message: 'You Shall not pass !' });
  }
};




//<<<<<<<<<<<<<<LOGOUT<<<<<<<<<<<<<<<<<<<<<<
server.delete('/logout',(req,res) =>{
  if (req.session){
        //  console.log(req.session);
         req.session.destroy((err)=>{
               if(err){
                      res.status(400).send('unable to logout...')
                }  else{
           res.send({bye :'Au Revoir!'})
          }
        });

       } else {
   res.end();
   }
  })
module.exports = server;