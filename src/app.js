const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();

app.use(express.json())
app.use('/users',userRouter) // rout name defines in mais app file
app.use(taskRouter) // rout name define in outer js file 

module.exports = app
