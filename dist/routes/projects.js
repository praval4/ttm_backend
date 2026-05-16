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
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const router = express_1.default.Router();
router.post('/', auth_1.protect, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { name, description, members, workspaceId } = req.body;
        let finalWorkspaceId = workspaceId;
        if (!finalWorkspaceId) {
            const userWorkspace = yield Workspace_1.default.findOne({ members: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
            if (userWorkspace) {
                finalWorkspaceId = userWorkspace._id;
            }
            else {
                const newWorkspace = new Workspace_1.default({
                    name: `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.name}'s Workspace`,
                    owner: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
                    members: [(_d = req.user) === null || _d === void 0 ? void 0 : _d._id]
                });
                yield newWorkspace.save();
                yield User_1.default.findByIdAndUpdate((_e = req.user) === null || _e === void 0 ? void 0 : _e._id, {
                    $push: { workspaceIds: newWorkspace._id }
                });
                finalWorkspaceId = newWorkspace._id;
            }
        }
        const project = new Project_1.default({
            name,
            description,
            owner: (_f = req.user) === null || _f === void 0 ? void 0 : _f._id,
            members: members || [(_g = req.user) === null || _g === void 0 ? void 0 : _g._id],
            workspaceId: finalWorkspaceId,
        });
        const createdProject = yield project.save();
        res.status(201).json(createdProject);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.get('/', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { workspaceId } = req.query;
        let query = {};
        if (workspaceId) {
            query.workspaceId = workspaceId;
        }
        let projects;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'Admin') {
            projects = yield Project_1.default.find(query).populate('owner', 'name email').populate('members', 'name email role');
        }
        else {
            query.members = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            projects = yield Project_1.default.find(query).populate('owner', 'name email').populate('members', 'name email role');
        }
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.get('/:id', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const project = yield Project_1.default.findById(req.params.id).populate('owner', 'name email').populate('members', 'name email role');
        if (project) {
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'Admin' || project.members.some(member => { var _a, _b; return member._id.toString() === ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()); })) {
                res.json(project);
            }
            else {
                res.status(403).json({ message: 'Not authorized to view this project' });
            }
        }
        else {
            res.status(404).json({ message: 'Project not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.put('/:id', auth_1.protect, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, members } = req.body;
        const project = yield Project_1.default.findById(req.params.id);
        if (project) {
            project.name = name || project.name;
            project.description = description || project.description;
            project.members = members || project.members;
            const updatedProject = yield project.save();
            res.json(updatedProject);
        }
        else {
            res.status(404).json({ message: 'Project not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.delete('/:id', auth_1.protect, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield Project_1.default.findById(req.params.id);
        if (project) {
            yield Task_1.default.deleteMany({ project: project._id });
            yield project.deleteOne();
            res.json({ message: 'Project removed' });
        }
        else {
            res.status(404).json({ message: 'Project not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
