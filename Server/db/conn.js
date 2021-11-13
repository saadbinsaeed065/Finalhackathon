const mongoose=require('mongoose')

const DB=process.env.DATABASE

mongoose.connect(DB,{
    useNewURLParser:true,
    useUnifiedTopology:true
}).then(()=>{
    console.log('connection successful');
}).catch((err)=>
console.log(err));