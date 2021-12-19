const dotenv=require('dotenv')
const mongoose=require('mongoose')
const cookieparser=require('cookie-parser')
 const cors=require('cors')
const express=require('express')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const User=require('./model/userschema')
const Otp=require('./model/otp')
const aunthenticate= require('./middleware/authenticate')
const {Server}=require('socket.io')
const http= require('http')
const postmark=require('postmark')
const {
    stringToHash,
    varifyHash
} =require('bcrypt-inzi') 
const path=require('path')
const app = express()

const server=http.createServer(app)

dotenv.config({path:'./config.env'})

const SECRET = process.env.SECRET || "12345"
const POSTMARK_KEY = process.env.POSTMARK_KEY || "3fb0f0d2-8a71-44eb-aad9-45e8245f8b8c"
const PORT = process.env.PORT || 5001


let client = new postmark.ServerClient(POSTMARK_KEY);

mongoose.connect('mongodb+srv://saad:saad720310.@cluster0.ylkly.mongodb.net/saylanicw?retryWrites=true&w=majority');


//to convert data from json to obj we use middleware
app.use(express.json())
app.use(cookieparser())


app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5001"],
    credentials: true
}))

app.use('/', express.static(path.join(__dirname, 'web/build')))
app.get("/", (req, res, next) => {
    res.sendFile(path.join(__dirname, "./web/build/index.html"))
})





   
 app.post('/api/v1/signup',async (req,res)=>{

    const{name,email,fathername,cnic,nooffamilymem,phoneNumber,password,dob}=req.body;

    //validation that any field shoul not empty
    if(!name || !email || !fathername || !cnic || !nooffamilymem || !phoneNumber || !password || !dob){

        return res.status(422).json({error:'plz filled the field properly'})

    }


try {   
    //checking if user already register or not
    const userexist=await User.findOne({email:email})

 if(userexist){

        return res.status(422).json({error:'Email already exist'})
     } else {


        
           // if user don't exist then it will register it will save in users collection that we require upper
    const user=new User({name,email,fathername,cnic,nooffamilymem,phoneNumber,password,dob})

    const register= await user.save()
 
         if(register){
 
                  res.status(201).json({message:'user registered successfully'})
 
           }else{
 
                   res.status(500).json({message:'Failed to register'})
           }
                  
     }

  } catch (err) {
    console.log(err);
}
    
})


 //Login route

 app.post('/api/v1/login',async (req,res)=>{
     try {
         //getting data that user enters
        const{email,password}=req.body;
          
        //for empty field validation
        if(!email || !password){

             return res.status(400).json({message:'Plz fill the fields'})
        }

        const userlogin=await User.findOne({email:email})

      if(userlogin){

        const ismatch=await bcrypt.compare(password,userlogin.password);

        //token generating
        const token=await userlogin.generateAuthToken();

        console.log(token);

//send the token to cookie
        res.cookie('jwtoken',token,{

            expires:new Date(Date.now()+25892000000),

            httpOnly:true
        })
      

             if(!ismatch){

                 res.status(400).json({message:'Invalid Credentials'})

             }else{

                  res.status(201).json({message:'login successfully'})

             }
      }else{
        res.json({message:'Invalid Credentials'})
      }
        //we are comparing password that user enterd with the registered users for signin
       
      
      
        
        

     } catch (error) {
         console.log(error);
     }
     
 })

 app.get('/about',aunthenticate,(req,res)=>{
    res.send(req.rootuser)
    })

    //get user data for contact and home page
    app.get('/getdata',aunthenticate,(req,res)=>{
    res.send(req.rootuser)
})



app.post('/contact', aunthenticate, async (req,res)=>{
   
    try {
        const {name, email, phoneNumber, message}= req.body;

        if(!name || !email || !phoneNumber || !message){
            return res.status(400).json({message:'Plz fill the fields'})
        }

        const usercontact = await User.findOne({_id: req.userid})

        if(usercontact){
            const usermessage= await usercontact.addMessage(name, email, phoneNumber, message)

            await usercontact.save();

            res.status(201).json({message:'contact infomation sent successfully'})

        }
    } catch (error) {
        console.log(error);
    }
    })


    app.get('/logout',aunthenticate, async(req,res)=>{

        try {
            const options={
                expires:new Date(Date.now()+1000)
            }
            
            res.cookie('jwtoken', 'expiredtoken', options)
            res.status(200).send('User Logout')

        } catch (error) {
            res.status(500).send(error)
        }
   
        })



app.post('/api/v1/otp', (req, res, next) => {

            if (!req.body.email) {
                console.log("required field missing");
                res.status(403).send("required field missing");
                return;
            }
            console.log("req.body: ", req.body);
        
            User.findOne({ email: req.body.email }, (err, user) => {
        
                if (err) {
                    res.status(500).send("error in getting database")
                } else {
                    if (user) {
        
                        function getRandomArbitrary(min, max) {
                            return Math.random() * (max - min) + min;
                        }
                        const otp = getRandomArbitrary(11111, 99999).toFixed(0);
        
                        stringToHash(otp).then(hash => {
        
                            let newOtp = new Otp({
                                email: req.body.email,
                                otp: hash
                            })
                            newOtp.save((err, saved) => {
                                if (!err) {
        
                                    client.sendEmail({
                                        "From": "info@sysborg.com",
                                        "To": req.body.email,
                                        "Subject": "forget password OTP",
                                        "TextBody": `Hi ${user.name}, your 5 digit OTP is: ${otp}`
                                    }).then((success, error) => {
                                        if (!success) {
                                            console.log("postmark error: ", error)
                                        }
                                    });
        
                                    res.send({ otpSent: true, message: "otp genrated" });
                                } else {
                                    console.log("error: ", err);
                                    res.status(500).send("error saving otp on server")
                                }
                            })
                        })
        
                    } else {
                        res.send("user not found");
                    }
                }
            })
        })
app.post('/api/v1/forget', (req, res, next) => {
        
            if (!req.body.email || !req.body.otp || !req.body.newPassword) {
                console.log("required field missing");
                res.status(403).send("required field missing");
                return;
            }
            console.log("req.body: ", req.body);
         
            Otp.findOne({ email: req.body.email })
                .sort({ _id: -1 })
                .exec((err, otp) => {
        
                    if (err) {
                        res.status(500).send("error in getting database")
                    } else {
                        if (otp) {
        
                            const created = new Date(otp.created).getTime;
                            const now = new Date().getTime;
                            const diff = now - created
        
                            if (diff > 300000 || otp.used) {
                                res.status(401).send("otp not valid");
                            } else {
                                varifyHash(req.body.otp, otp.otp).then(isMatch => {
                                    if (isMatch) {
        
                                        stringToHash(req.body.newPassword).then((hashPassword) => {
                                            User.findOneAndUpdate(
                                                { email: req.body.email },
                                                { password: hashPassword },
                                                {},
                                                (err, updated) => {
                                                    if (!err) {
                                                        res.send("password updated");
                                                    } else {
                                                        res.status(500).send("error updating user")
                                                    }
                                                })
                                        })
                                        otp.update({ used: true })
                                            .exec((err, updated) => {
                                                if (!err) {
                                                    console.log("otp updated")
                                                } else {
                                                    console.log("otp update fail: ", err)
                                                }
                                            })
        
                                    } else {
                                        res.status(401).send("otp not valid")
                                    }
                                })
                            }
                        } else {
                            res.status(400).send("invalid otp");
                        }
                    }
                })
        })
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})