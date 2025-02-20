const mongoose=require('mongoose') ;

const usersSchema = new mongoose.Schema({
    username: { type: String, },
    email: { type: String, unique: true },
    password: { type: String, },
    resetToken: {type:String},
    resetTokenExpiration: {type:Date},
    phoneNumber:{type:Number},
    facebook_id:{type:Number}
  });
  
module.exports=mongoose.model('User',usersSchema);