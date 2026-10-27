// server/controllers/taskController.js
const Task = require('../models/Task');

// @desc Create a new task
// @route POST /api/tasks
// @access Private
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, assignee: req.user });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all tasks for the logged‑in user (optional project filter)
// @route GET /api/tasks
// @access Private
exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    const tasks = await Task.find(filter).populate('project', 'name');
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get a single task by id
// @route GET /api/tasks/:id
// @access Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('getTask error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update a task
// @route PUT /api/tasks/:id
// @access Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Delete a task
// @route DELETE /api/tasks/:id
// @access Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all tasks belonging to a specific project
// @route GET /api/tasks/project/:projectId
// @access Private
exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('project', 'name');
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('getProjectTasks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
