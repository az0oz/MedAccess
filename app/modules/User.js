const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
//connect to mongoDB

userSchema  = new Schema ({
    name: {
        type:String,
        required: true
    },
    sex: {
        type:String,
        enum: ['male','female'],
        required: true
    },
    dateOfBirth: {
        type:Date,
        required: true
    },
    email:{
        type:String,
        index:true,
        required: true,
        unique: true
    }, 
    password: {
        type:String,
        required: true
    },
    role: {
        type:String,
        enum: ['patient','physician','labTechnician']
    },
    accessList:[{user_id:String,hashedkey:String}],
    date: {
        type:Date,
        default: Date.now
    },
    publicKey:{
        type:String,
        required:true
    },
    hashOfSymmetric:{
     type:String,
    }
})

userSchema.plugin(uniqueValidator);


module.exports = mongoose.model('Users', userSchema);