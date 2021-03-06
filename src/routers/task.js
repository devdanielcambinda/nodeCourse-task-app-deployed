const express = require('express')
const Task = require("../models/task")
const auth = require('../middleware/auth');
const router = new express.Router()

router.post("/tasks",auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

//GET /tasks?completed=false
//GET /tasks?limit=10&skip= limit- set how many we are presenting  skip-0 to first page 10 to second page 20 to third page ...  
//GET /tasks?sortBy=createdAt_desc
router.get("/tasks",auth, async (req, res) => {
  const match ={}
  const sort = {

  }
  if(req.query.completed){
    match.completed = req.query.completed === 'true'
  }

  if(req.query.sortBy){
    const [field , order] = req.query.sortBy.split('_')
    sort[field] = order === 'desc' ? -1 : 1
  }

  try {
    //const tasks = await Task.find({owner: req.user._id})
    //or
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    })
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:id",auth, async (req, res) => {
  const _id= req.params.id
  try {
    const task = await Task.findOne({_id, owner: req.user._id})

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/tasks/:id",auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  const _id = req.params.id;

  try {
    const task = await Task.findOne({_id, owner: req.user._id});

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/tasks/:id",auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({_id, owner: req.user._id});

    if (!task) {
      return res.status(404).send();
    }

    await task.delete()
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
})

module.exports = router