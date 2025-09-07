const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const e = require('cors')

const app = express()
app.use(cors({
  origin:'http://localhost:3001',
  credentials: true 
}))
app.use(session({
   secret:"secret-key",
   resave: false,
   saveUninitialized: false,
    cookie: {
    httpOnly: true,
    secure: false, 
    maxAge: 1000 * 60 * 60 
  }
})
)
app.use(cookieParser())
app.use(express.json())


const db = new sqlite3.Database('./database.db',(err) => {
    if (err){
        console.error(err.message)
    }
    console.log('Connected to the SQLite Database')
})

const PORT = 3000;
app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

//
const isAuthenticated = (req,res,next) => {
  if(req.session.user){
    next();
}else{
  res.redirect("/login")
}
}



//register user
app.post('/register',async(req,res) => {
  const {email,password} = req.body 
  const hashedPassword = await bcrypt.hash(req.body.password,10)
  const sql = `SELECT * FROM user WHERE 
  email = ?`
  db.get(sql,[email],(err,row)=>{
    if(err){
      return res.status(400).json({Error:err.message})
    }
    console.log(row)
    if(row){
     return res.json({message: "User Already Exists"})
    }
    const createUserQuery = `
    INSERT INTO user(email,password)
    VALUES(?,?)
    `
    db.run(createUserQuery,[email,hashedPassword],function(err){
      if(err){
        return res.status(400).json({Error: err.message})
      }
       res.json({message: "User Registered Successfully"})
    })
  })
});

//login user 
app.post('/login',async(req,res) => {
  const {email,password} = req.body 
  if(!email || !password){
    res.send("Email and Password are required")
  }
  const sql = `SELECT * FROM user WHERE email = '${email}'`
  const dbUser =  db.get(sql,[],async(err,row) => {
        if(err){
          return res.status(400).send({Error:err.message})
        }
        if(row){
          const isPassword = await bcrypt.compare(password,row.password)
          console.log(isPassword)
          if(isPassword){
            req.session.user = email
            res.cookie("sessionId",req.sessionID)
            res.send("Login Success")
          }else{
            res.status(401).send("Invalid Password")
          }
        }else{
          res.send("Invalid User")
        }
  })
})



//logout 
app.post("/logout",(req,res) =>{
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Error Logging out",err)
    res.clearCookie("sessionId")
    res.status(200).send("Logged out")
  })
})

//Dashboard 
app.get('/dashboard',isAuthenticated,async(req,res) => {
   const email = req.session.user
   
})
