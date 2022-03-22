const mongoose = require("mongoose");
const Task = require('../models/task')
const validator = require("validator");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error("Age must be a positive number.");
      }
    },
  },
  email: {
    type: String,
    unique:true,
    require: true,
    trim: true,
    lowercase: true,
    validate(value) {
      const isValid = validator.isEmail(value);
      if (!isValid) {
        throw new Error("Invalid email.");
      }
    },
  },
  password: {
    type: String,
    require: true,
    minLength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes("password"))
        throw new Error('Your password can not contain the word "password".');
    },
  },
  tokens:[{
    token:{
      type: String,
      required:true
    }
  }],
  avatar:{
    type: Buffer
  }
},{
  timestamps: true
})

userSchema.virtual('tasks',{
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

//methods of the instances
userSchema.methods.generateAuthToken = async function(){
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({token})
  await user.save()
  
  return token
}

userSchema.methods.toJSON = function(){
  const user = this

  const userObject = user.toObject()
  
  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar
  delete userObject.__v
  // items sent: _id, name, email,age


  return userObject
}

//methods of the model
userSchema.statics.findByCredentials = async (email,password)=>{
  const user = await User.findOne({email})
  if(!user){
    throw new Error("You have entered an invalid email or password");
  }
  const isMatch = await bcrypt.compare(password,user.password)

  if(!isMatch){
    throw new Error("You have entered an invalid email or password");
  }

  return user

}

//hash the plain text password before saving
userSchema.pre('save',async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,10)
    }

    next()
})

//Delete User tasks when user is removed 
userSchema.pre('remove',async function(next){
  const user = this
  await Task.deleteMany({owner: user._id})
  next()
})
const User = mongoose.model("User", userSchema);

module.exports = User