import express, { Response } from 'express';
import { protect, admin, AuthRequest } from '../middleware/auth';
import Project from '../models/Project';
import User from '../models/User';
import Task from '../models/Task';
import Workspace from '../models/Workspace';

const router = express.Router();

router.post('/', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, members, workspaceId } = req.body;

    let finalWorkspaceId = workspaceId;
    if (!finalWorkspaceId) {
      const userWorkspace = await Workspace.findOne({ members: req.user?._id });
      if (userWorkspace) {
        finalWorkspaceId = userWorkspace._id;
      } else {
        const newWorkspace = new Workspace({
          name: `${req.user?.name}'s Workspace`,
          owner: req.user?._id,
          members: [req.user?._id]
        });
        await newWorkspace.save();
        await User.findByIdAndUpdate(req.user?._id, {
          $push: { workspaceIds: newWorkspace._id }
        });
        finalWorkspaceId = newWorkspace._id;
      }
    }

    const project = new Project({
      name,
      description,
      owner: req.user?._id,
      members: members || [req.user?._id],
      workspaceId: finalWorkspaceId,
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.query;
    let query: any = {};
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    let projects;
    if (req.user?.role === 'Admin') {
      projects = await Project.find(query).populate('owner', 'name email').populate('members', 'name email role');
    } else {
      query.members = req.user?._id;
      projects = await Project.find(query).populate('owner', 'name email').populate('members', 'name email role');
    }
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email').populate('members', 'name email role');

    if (project) {
      if (req.user?.role === 'Admin' || project.members.some(member => member._id.toString() === req.user?._id?.toString())) {
        res.json(project);
      } else {
        res.status(403).json({ message: 'Not authorized to view this project' });
      }
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, members } = req.body;

    const project = await Project.findById(req.params.id);

    if (project) {
      project.name = name || project.name;
      project.description = description || project.description;
      project.members = members || project.members;

      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      await Task.deleteMany({ project: project._id });
      await project.deleteOne();
      res.json({ message: 'Project removed' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
