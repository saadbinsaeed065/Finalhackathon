const express=require('express')
const router=express.Router();
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
require('../db/conn')
const User=require('../model/userschema')
const aunthenticate= require('../middleware/authenticate')

router.get('/', (req,res)=>{

    res.send("hello from the server router js")

    })

   
router.post('/register',async (req,res)=>{

    const{name,email,phone,work,password,cpassword}=req.body;

    //validation that any field shoul not empty
    if(!name || !email || !phone ||!work || !password || !cpassword){

        return res.status(422).json({error:'plz filled the field properly'})

    }


try {   
    //checking if user already register or not
    const userexist=await User.findOne({email:email})

 if(userexist){

        return res.status(422).json({error:'Email already exist'})
     }

           // if user don't exist then it will register it will save in users collection that we require upper
    const user=new User({name,email,phone,work,password,cpassword})

   const register= await user.save()

        if(register){

                 res.status(201).json({message:'user registered successfully'})

          }else{

                  res.status(500).json({message:'Failed to register'})
          }
                 
  } catch (err) {
    console.log(err);
}
    
})


 //Login route

 router.post('/signin',async (req,res)=>{
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
        .send();

             if(!ismatch){

                 res.status(400).json({message:'Invalid Credentials'})

             }else{

                  res.status(201).json({message:'login successfully'})

             }
      }else{
        res.json({message:'Invalid Credentials'})
      }
        //we are comparing password that user enterd with the registered users for signin
       
        console.log(userlogin);
      
        
        

     } catch (error) {
         console.log(error);
     }
     
 })

 router.get('/about',aunthenticate,(req,res)=>{
    res.send(req.rootuser)
    })

    //get user data for contact and home page
router.get('/getdata',aunthenticate,(req,res)=>{
    res.send(req.rootuser)
})



router.post('/contact', aunthenticate, async (req,res)=>{
   
    try {
        const {name, email, phone, message}= req.body;

        if(!name || !email || !phone || !message){
            return res.status(400).json({message:'Plz fill the fields'})
        }

        const usercontact = await User.findOne({_id: req.userid})

        if(usercontact){
            const usermessage= await usercontact.addMessage(name, email, phone, message)

            await usercontact.save();

            res.status(201).json({message:'contact infomation sent successfully'})

        }
    } catch (error) {
        console.log(error);
    }
    })


    router.get('/logout',aunthenticate, async(req,res)=>{

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

module.exports=router;