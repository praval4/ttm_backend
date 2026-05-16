import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Project from '../models/Project';
import Task from '../models/Task';
import User from '../models/User';

const router = express.Router();

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const workspaceId = req.query.workspaceId as string | undefined;

    let projectQuery: any = {};
    let taskQuery: any = {};

    if (workspaceId) {
      projectQuery.workspaceId = workspaceId;
      const projectsInWorkspace = await Project.find({ workspaceId }).select('_id');
      const projectIds = projectsInWorkspace.map(p => p._id);
      taskQuery.project = { $in: projectIds };
    }

    if (req.user?.role !== 'Admin') {
      projectQuery.members = req.user?._id;
      taskQuery.assignee = req.user?._id;
    }

    const totalProjects = await Project.countDocuments(projectQuery);
    const totalTasks = await Task.countDocuments(taskQuery);
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $in: ['Todo', 'In Progress', 'Review'] } });
    const overdueTasks = await Task.countDocuments({ ...taskQuery, deadline: { $lt: now }, status: { $ne: 'Completed' } });

    let focusScoreValue = 0;
    if (overdueTasks === 0 && completedTasks > 0) {
      focusScoreValue = 10;
    } else if (overdueTasks > 0) {
      focusScoreValue = completedTasks / overdueTasks;
    }
    
    let focusStatus = 'Risky';
    if (focusScoreValue >= 3 || (overdueTasks === 0 && completedTasks > 0)) {
      focusStatus = 'Excellent';
    } else if (focusScoreValue >= 1) {
      focusStatus = 'Good';
    }

    const insights: string[] = [];

    const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    if (totalTasks > 0) {
      insights.push(`Sprint completion probability: ${completionPercentage}%`);
    }

    if (overdueTasks > 0) {
      if (req.user?.role === 'Admin') {
        insights.push(`Warning: There are ${overdueTasks} overdue tasks across the workspace.`);
      } else {
        insights.push(`You have ${overdueTasks} overdue tasks.`);
      }
    }

    if (req.user?.role === 'Admin') {
      const activeTasks = await Task.find({ ...taskQuery, status: { $ne: 'Completed' } }).populate('assignee', 'name');
      const workloadMap: Record<string, { count: number, name: string }> = {};
      
      let maxTasks = 0;
      let busiestMember = '';

      activeTasks.forEach(task => {
        if (task.assignee) {
          const userId = task.assignee._id.toString();
          const name = (task.assignee as any).name;
          if (!workloadMap[userId]) workloadMap[userId] = { count: 0, name };
          workloadMap[userId].count++;

          if (workloadMap[userId].count > maxTasks) {
            maxTasks = workloadMap[userId].count;
            busiestMember = name;
          }
        }
      });

      const memberCounts = Object.values(workloadMap).map(v => v.count);
      if (memberCounts.length > 1) {
        const avgTasks = memberCounts.reduce((a, b) => a + b, 0) / memberCounts.length;
        if (maxTasks > avgTasks * 2 && maxTasks > 3) {
          insights.push('Workload imbalance detected.');
          insights.push(`${busiestMember} is currently the busiest member with ${maxTasks} active tasks.`);
        }
      }
    }

    res.json({
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionPercentage
      },
      focusScore: {
        value: focusScoreValue.toFixed(1),
        status: focusStatus
      },
      insights
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
