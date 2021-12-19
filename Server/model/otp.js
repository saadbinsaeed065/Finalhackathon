const mongoose=require('mongoose')

const otpSchema=new mongoose.Schema({
   email:String,
   otp: String,
   used: { type: Boolean, default: false },
   created: { type: Date, default: Date.now },
})


const Otp=mongoose.model('Otp',otpSchema)
module.exports=Otp;
