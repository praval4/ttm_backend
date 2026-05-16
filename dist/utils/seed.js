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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const User_1 = __importDefault(require("../models/User"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const Project_1 = __importDefault(require("../models/Project"));
const Task_1 = __importDefault(require("../models/Task"));
const db_1 = __importDefault(require("../config/db"));
const seedData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        yield User_1.default.deleteMany();
        yield Workspace_1.default.deleteMany();
        yield Project_1.default.deleteMany();
        yield Task_1.default.deleteMany();
        console.log('Cleared existing data.');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const password = yield bcryptjs_1.default.hash('password123', salt);
        const admin = yield User_1.default.create({ name: 'Alex Admin', email: 'admin@demo.com', password, role: 'Admin' });
        const member1 = yield User_1.default.create({ name: 'Sarah Member', email: 'sarah@demo.com', password, role: 'Member' });
        const member2 = yield User_1.default.create({ name: 'John Dev', email: 'john@demo.com', password, role: 'Member' });
        const workspace = yield Workspace_1.default.create({
            name: 'Alpha Team Workspace',
            owner: admin._id,
            members: [admin._id, member1._id, member2._id]
        });
        admin.workspaceIds = [workspace._id];
        yield admin.save();
        member1.workspaceIds = [workspace._id];
        yield member1.save();
        member2.workspaceIds = [workspace._id];
        yield member2.save();
        const project1 = yield Project_1.default.create({
            name: 'Q3 Marketing Website',
            description: 'Redesigning the main corporate site',
            owner: admin._id,
            members: [admin._id, member1._id, member2._id],
            workspaceId: workspace._id
        });
        const now = new Date();
        const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        yield Task_1.default.insertMany([
            { title: 'Design Landing Page', description: 'Figma mockups', project: project1._id, assignee: member1._id, status: 'Completed', deadline: past, priority: 'High', estimatedHours: 5, tags: ['Design', 'UI'] },
            { title: 'Setup Next.js Frontend', description: 'Init project', project: project1._id, assignee: member2._id, status: 'Completed', deadline: past, priority: 'Medium', estimatedHours: 3, tags: ['Code', 'Frontend'] },
            { title: 'Write Copywriting', description: 'Hero section text', project: project1._id, assignee: member1._id, status: 'In Progress', deadline: future, priority: 'Medium', estimatedHours: 4, tags: ['Content'] },
            { title: 'Deploy to Railway', description: 'Setup CD', project: project1._id, assignee: member2._id, status: 'Todo', deadline: past, priority: 'High', estimatedHours: 2, tags: ['DevOps'] },
            { title: 'Database Schema', description: 'MongoDB models', project: project1._id, assignee: member2._id, status: 'Todo', deadline: past, priority: 'High', estimatedHours: 6, tags: ['Backend'] },
            { title: 'API Documentation', description: 'Swagger docs', project: project1._id, assignee: member1._id, status: 'Review', deadline: future, priority: 'Low', estimatedHours: 2, tags: ['Docs'] },
        ]);
        console.log('Demo data seeded successfully!');
        process.exit();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
seedData();
