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
const Workspace_1 = __importDefault(require("../models/Workspace"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
router.post('/', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { name } = req.body;
        const workspace = new Workspace_1.default({
            name,
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            members: [(_b = req.user) === null || _b === void 0 ? void 0 : _b._id],
        });
        const createdWorkspace = yield workspace.save();
        yield User_1.default.findByIdAndUpdate((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, {
            $push: { workspaceIds: createdWorkspace._id },
        });
        res.status(201).json(createdWorkspace);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.get('/', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const workspaces = yield Workspace_1.default.find({ members: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }).populate('owner', 'name email').populate('members', 'name email');
        res.json(workspaces);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.get('/:id', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspace = yield Workspace_1.default.findById(req.params.id).populate('owner', 'name email').populate('members', 'name email');
        if (workspace && workspace.members.some(m => { var _a, _b; return m._id.toString() === ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()); })) {
            res.json(workspace);
        }
        else {
            res.status(404).json({ message: 'Workspace not found or unauthorized' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.post('/:id/invite', auth_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { email } = req.body;
        const workspace = yield Workspace_1.default.findById(req.params.id);
        if (!workspace) {
            res.status(404).json({ message: 'Workspace not found' });
            return;
        }
        if (workspace.owner.toString() !== ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'Admin') {
            res.status(403).json({ message: 'Not authorized to invite members to this workspace' });
            return;
        }
        const userToInvite = yield User_1.default.findOne({ email });
        if (!userToInvite) {
            res.status(404).json({ message: 'User with this email not found' });
            return;
        }
        if (workspace.members.includes(userToInvite._id)) {
            res.status(400).json({ message: 'User is already a member of this workspace' });
            return;
        }
        workspace.members.push(userToInvite._id);
        yield workspace.save();
        if (!userToInvite.workspaceIds)
            userToInvite.workspaceIds = [];
        userToInvite.workspaceIds.push(workspace._id);
        yield userToInvite.save();
        res.json({ message: 'User invited successfully', workspace });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
