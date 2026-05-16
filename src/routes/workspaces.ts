import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Workspace from '../models/Workspace';
import User from '../models/User';
import Project from '../models/Project';

const router = express.Router();

router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const workspace = new Workspace({
      name,
      owner: req.user?._id,
      members: [req.user?._id],
    });

    const createdWorkspace = await workspace.save();

    await User.findByIdAndUpdate(req.user?._id, {
      $push: { workspaceIds: createdWorkspace._id },
    });

    res.status(201).json(createdWorkspace);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaces = await Workspace.find({ members: req.user?._id }).populate('owner', 'name email').populate('members', 'name email');
    res.json(workspaces);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('owner', 'name email').populate('members', 'name email');
    
    if (workspace && workspace.members.some(m => m._id.toString() === req.user?._id?.toString())) {
      res.json(workspace);
    } else {
      res.status(404).json({ message: 'Workspace not found or unauthorized' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/invite', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    if (workspace.owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'Admin') {
      res.status(403).json({ message: 'Not authorized to invite members to this workspace' });
      return;
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      res.status(404).json({ message: 'User with this email not found' });
      return;
    }

    if (workspace.members.includes(userToInvite._id as any)) {
      res.status(400).json({ message: 'User is already a member of this workspace' });
      return;
    }

    workspace.members.push(userToInvite._id as any);
    await workspace.save();

    if (!userToInvite.workspaceIds) userToInvite.workspaceIds = [];
    userToInvite.workspaceIds.push(workspace._id as any);
    await userToInvite.save();

    res.json({ message: 'User invited successfully', workspace });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
