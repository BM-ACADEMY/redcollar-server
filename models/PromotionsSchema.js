// const mongoose=require('mongoose');

// const promotionsSchema=new mongoose.Schema({
//     title:{
//       type:String,
//       required:[true,"please provide title"]
//     },
//     Image:{
//       type:String,
//       required:[true,"please provide Image"]
//     }
//   },{timestamps:true})

//   module.exports=mongoose.model('Promo',promotionsSchema)


const mongoose = require('mongoose');

const promotionsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title"]
  },
  message: {
    type: String,
    required: [true, "Please provide a message"]
  },
  Image: {
    type: String,
    required: [true, "Please provide an image"]
  },
  time: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Promo', promotionsSchema);

