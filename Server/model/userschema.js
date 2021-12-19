const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
email:{
    type:String,
    required:true
},
fathername:{
    type:String,
    required:true
},
cnic:{
    type:String,
    required:true
},
nooffamilymem:{
    type:Number,
    required:true
},
phoneNumber:{
    type:Number,
    required:true
},
dob:{
    type:Date,
    required:true
},
password:{
    type:String,
    required:true
},
date:{
type:Date,
default:Date.now()
},
messages:[
    {
         name:{
                type:String,
                required:true
            },
        email:{
            type:String,
            required:true
        },
        phoneNumber:{
            type:Number,
            required:true
        },
        message:{
            type:String,
            required:true
        }
}
],
tokens:[
    {
        token:{
            type:String,
            required:true
        }
    }
]
})


//hashing the password
userSchema.pre('save',async function (next){
    console.log('hi this is from inside');
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,12);
    }
    next();
})

// we are generating token
// we are working with userschema  and it is instance if we are working with instance we use method
userSchema.methods.generateAuthToken=async function(){

    try {
        
        //token generate
       let token=jwt.sign({_id:this._id}, process.env.SECRET_KEY) 
       //token adding to the field
       this.tokens=this.tokens.concat({token:token});
       await this.save();
       return token;

    } catch (error) {
        console.log(error);
    }
}

userSchema.methods.addMessage= async function(name, email, phoneNumber, message){

    try {
        this.messages=this.messages.concat({name, email, phoneNumber, message})
        await this.save();
        return this.messages;


    } catch (error) {
        console.log(error);
    }
}


const User=mongoose.model('users',userSchema)
module.exports=User;

