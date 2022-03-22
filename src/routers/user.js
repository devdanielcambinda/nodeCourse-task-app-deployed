const express = require('express')
const User = require('../models/user')
const auth = require("../middleware/auth");
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()

//deletes dest so that data can be manipulated
const avatarUploads = multer({
  limits:{
    fileSize: 1000000 // unite: bytes --> 1 MB
  },
  fileFilter(req,file,cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
      return cb(new Error('Please insert a image file'))
    }
    cb(undefined,true)
  }
})

router.post("/", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email,user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({user,token});
  } catch (e) {
    res.status(400).send(e);
  }
})

router.post('/login',async (req,res)=>{

  const email = req.body.email;
  const password = req.body.password
  
  try{
    let user = await User.findByCredentials(email,password)
    const token = await user.generateAuthToken()
    res.send({ user,token})
  }catch(e){
    //e.message so that the message in the findCredentials can be sent as result
    res.status(400).send(e.message)
  }
})

router.post('/logout',auth,async (req,res)=>{
    try{
      req.user.tokens = req.user.tokens.filter(token =>{
        return token.token !== req.token
      })
      await req.user.save()
      res.send()
    }catch(e){
      res.status(500).send()
    }
})

router.post('/logoutAll',auth,async (req,res) =>{
  try{
    req.user.tokens = []
    await req.user.save()
    res.send()
  }catch(e){
    res.status(500).send()
  }
})


//created and updates a avatar
router.post('/me/avatar',auth,avatarUploads.single('avatar'), async (req,res)=>{

  const buffer = await sharp(req.file.buffer)
  .resize({
    width:250,
    height:250
  })
  .png()
  .toBuffer()

  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error,req,res,next)=>{
  res.status(400).send({error: error.message})
})

router.get("/me", auth,async (req, res) => {
  res.send(req.user)
})

router.get('/:id/avatar', async (req,res)=>{
  try{
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar){
      throw new Error()
    }

    res.set('Content-Type','image/png')
    res.send(user.avatar)
  }catch(e){
    res.status(404).send()
  }
})

router.patch("/me",auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"]
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" })
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]))

    await req.user.save()

    res.send(req.user)

  } catch (e) {
    res.status(400).send(e)
  }
});

router.delete("/me", auth ,async (req, res) => {
  try {
    await req.user.remove()
    sendCancelationEmail(req.user.email,req.user.name)
    res.send(req.user);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
})

router.delete('/me/avatar',auth, async (req,res)=>{

  if (!req.user.avatar) {
    res.status(400).send("No avatar to delete!");
  }

  try{
    req.user.avatar = undefined
    console.log(req.user)
    await req.user.save()
    res.send()
  }catch(e){
    res.status(500).send(e)
  }
})



module.exports = router 