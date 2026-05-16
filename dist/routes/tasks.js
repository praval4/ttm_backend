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
const Task_1 = __importDefault(require("../models/Task"));
const Project_1 = __importDefault(require("../models/Project"));
const router = express_1.default.Router();
router.post('/', auth_1.protect, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, project, assignee, deadline, priority, blockers, estimatedHours, tags } = req.body;
        const projectExists = yield Project_1.default.findById(project);
        if (!projectExists) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        if (assignee && !projectExists.members.includes(assignee)) {
            projectExists.members.push(assignee);
            yield projectExists.save();
        }
        const task = new Task_1.default({
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
        const createdTask = yield task.save();
        res.status(201).json(createdTask);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.get('/', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let tasks;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'Admin') {
            tasks = yield Task_1.default.find({}).populate('project', 'name').populate('assignee', 'name email');
        }
        else {
            tasks = yield Task_1.default.find({ assignee: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }).populate('project', 'name').populate('assignee', 'name email');
        }
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.get('/project/:projectId', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const project = yield Project_1.default.findById(req.params.projectId);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'Admin' && !project.members.some(m => { var _a, _b; return m.toString() === ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()); })) {
            res.status(403).json({ message: 'Not authorized to view tasks for this project' });
            return;
        }
        const tasks = yield Task_1.default.find({ project: req.params.projectId }).populate('assignee', 'name email');
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.put('/:id', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const task = yield Task_1.default.findById(req.params.id);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'Admin') {
            const { title, description, assignee, status, deadline, priority, blockers, estimatedHours, tags, progress } = req.body;
            task.title = title || task.title;
            task.description = description || task.description;
            task.assignee = assignee || task.assignee;
            task.status = status || task.status;
            task.deadline = deadline || task.deadline;
            if (priority)
                task.priority = priority;
            if (blockers)
                task.blockers = blockers;
            if (estimatedHours !== undefined)
                task.estimatedHours = estimatedHours;
            if (tags)
                task.tags = tags;
            if (progress !== undefined)
                task.progress = progress;
        }
        else {
            if (((_b = task.assignee) === null || _b === void 0 ? void 0 : _b.toString()) !== ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString())) {
                res.status(403).json({ message: 'Not authorized to update this task' });
                return;
            }
            const { status, progress } = req.body;
            if (status)
                task.status = status;
            if (progress !== undefined)
                task.progress = progress;
        }
        const updatedTask = yield task.save();
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.delete('/:id', auth_1.protect, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = yield Task_1.default.findById(req.params.id);
        if (task) {
            yield task.deleteOne();
            res.json({ message: 'Task removed' });
        }
        else {
            res.status(404).json({ message: 'Task not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
