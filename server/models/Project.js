// server/models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  demoUrl: { type: String, default: '' },
  repoUrl: { type: String, default: '' },
  isSubmitted: { type: Boolean, default: false },
  submittedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
