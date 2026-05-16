import express, { Response } from 'express';
import { protect, admin, AuthRequest } from '../middleware/auth';
import Task from '../models/Task';
import Project from '../models/Project';

const router = express.Router();

router.post('/', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, project, assignee, deadline, priority, blockers, estimatedHours, tags } = req.body;

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (assignee && !projectExists.members.includes(assignee)) {
      projectExists.members.push(assignee);
      await projectExists.save();
    }

    const task = new Task({
      title,
      description,
      project,
      assignee,
      deadline,
      priority,
      blockers,
      estimatedHours,
      tags
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let tasks;
    if (req.user?.role === 'Admin') {
      tasks = await Task.find({}).populate('project', 'name').populate('assignee', 'name email');
    } else {
      tasks = await Task.find({ assignee: req.user?._id }).populate('project', 'name').populate('assignee', 'name email');
    }
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/project/:projectId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.user?.role !== 'Admin' && !project.members.some(m => m.toString() === req.user?._id?.toString())) {
      res.status(403).json({ message: 'Not authorized to view tasks for this project' });
      return;
    }

    const tasks = await Task.find({ project: req.params.projectId }).populate('assignee', 'name email');
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (req.user?.role === 'Admin') {
      const { title, description, assignee, status, deadline, priority, blockers, estimatedHours, tags, progress } = req.body;
      task.title = title || task.title;
      task.description = description || task.description;
      task.assignee = assignee || task.assignee;
      task.status = status || task.status;
      task.deadline = deadline || task.deadline;
      if (priority) task.priority = priority;
      if (blockers) task.blockers = blockers;
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
      if (tags) task.tags = tags;
      if (progress !== undefined) task.progress = progress;
    } else {
      if (task.assignee?.toString() !== req.user?._id?.toString()) {
        res.status(403).json({ message: 'Not authorized to update this task' });
        return;
      }
      const { status, progress } = req.body;
      if (status) task.status = status;
      if (progress !== undefined) task.progress = progress;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (task) {
      await task.deleteOne();
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
