const jwt= require('jsonwebtoken')
const User=require('../model/userschema')

const Authenticate=async (req,res,next)=>{
           
    try {
        const token = req.cookies.jwtoken;
        const verifytoken = jwt.verify(token, process.env.SECRET_KEY);

        const rootuser= await User.findOne({_id: verifytoken._id, "tokens.token": token})

        if(!rootuser){
            throw new Error('User not found')
        }
        req.token=token;
        req.rootuser=rootuser;
        req.userid=rootuser._id;

        next();

    } catch (error) {
        res.status(401).send('Unauthorized:No token provided')
        console.log(error);
    }

}

module.exports=Authenticate;