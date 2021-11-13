const dotenv=require('dotenv')
const express=require('express')
const mongoose=require('mongoose')
const cookieparser=require('cookie-parser')
// const cors=require('cors')
const app=express()

dotenv.config({path:'./config.env'})

require('./db/conn')

//to convert data from json to obj we use middleware
app.use(express.json())


app.use(cookieparser())

//importing router file 
app.use(require('./router/auth'))


const PORT=process.env.PORT






app.get('/',(req,res)=>{
res.send("hello from the server")
})

// app.get('/about',middleware,(req,res)=>{
// res.send('we are in about location')
// })

app.get('/signin',(req,res)=>{
res.send("we are in signin location")
})

app.get('/signup',(req,res)=>{
res.send("we are in signup location")
})

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})