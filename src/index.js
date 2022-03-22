const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require("./routers/task")

const app=express()
const port = process.env.PORT 

app.use(express.json())
app.use('/users',userRouter) // rout name defines in mais app file
app.use(taskRouter) // rout name define in outer js file 

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
})