"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Project_1 = __importDefault(require("../models/Project"));
const Task_1 = __importDefault(require("../models/Task"));
const router = express_1.default.Router();
router.get('/', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const now = new Date();
        const workspaceId = req.query.workspaceId;
        let projectQuery = {};
        let taskQuery = {};
        if (workspaceId) {
            projectQuery.workspaceId = workspaceId;
            const projectsInWorkspace = yield Project_1.default.find({ workspaceId }).select('_id');
            const projectIds = projectsInWorkspace.map(p => p._id);
            taskQuery.project = { $in: projectIds };
        }
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'Admin') {
            projectQuery.members = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            taskQuery.assignee = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        }
        const totalProjects = yield Project_1.default.countDocuments(projectQuery);
        const totalTasks = yield Task_1.default.countDocuments(taskQuery);
        const completedTasks = yield Task_1.default.countDocuments(Object.assign(Object.assign({}, taskQuery), { status: 'Completed' }));
        const pendingTasks = yield Task_1.default.countDocuments(Object.assign(Object.assign({}, taskQuery), { status: { $in: ['Todo', 'In Progress', 'Review'] } }));
        const overdueTasks = yield Task_1.default.countDocuments(Object.assign(Object.assign({}, taskQuery), { deadline: { $lt: now }, status: { $ne: 'Completed' } }));
        let focusScoreValue = 0;
        if (overdueTasks === 0 && completedTasks > 0) {
            focusScoreValue = 10;
        }
        else if (overdueTasks > 0) {
            focusScoreValue = completedTasks / overdueTasks;
        }
        let focusStatus = 'Risky';
        if (focusScoreValue >= 3 || (overdueTasks === 0 && completedTasks > 0)) {
            focusStatus = 'Excellent';
        }
        else if (focusScoreValue >= 1) {
            focusStatus = 'Good';
        }
        const insights = [];
        const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        if (totalTasks > 0) {
            insights.push(`Sprint completion probability: ${completionPercentage}%`);
        }
        if (overdueTasks > 0) {
            if (((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) === 'Admin') {
                insights.push(`Warning: There are ${overdueTasks} overdue tasks across the workspace.`);
            }
            else {
                insights.push(`You have ${overdueTasks} overdue tasks.`);
            }
        }
        if (((_e = req.user) === null || _e === void 0 ? void 0 : _e.role) === 'Admin') {
            const activeTasks = yield Task_1.default.find(Object.assign(Object.assign({}, taskQuery), { status: { $ne: 'Completed' } })).populate('assignee', 'name');
            const workloadMap = {};
            let maxTasks = 0;
            let busiestMember = '';
            activeTasks.forEach(task => {
                if (task.assignee) {
                    const userId = task.assignee._id.toString();
                    const name = task.assignee.name;
                    if (!workloadMap[userId])
                        workloadMap[userId] = { count: 0, name };
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
