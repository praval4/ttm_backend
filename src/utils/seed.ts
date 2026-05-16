import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User';
import Workspace from '../models/Workspace';
import Project from '../models/Project';
import Task from '../models/Task';
import connectDB from '../config/db';

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Workspace.deleteMany();
    await Project.deleteMany();
    await Task.deleteMany();

    console.log('Cleared existing data.');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const admin = await User.create({ name: 'Alex Admin', email: 'admin@demo.com', password, role: 'Admin' });
    const member1 = await User.create({ name: 'Sarah Member', email: 'sarah@demo.com', password, role: 'Member' });
    const member2 = await User.create({ name: 'John Dev', email: 'john@demo.com', password, role: 'Member' });

    const workspace = await Workspace.create({
      name: 'Alpha Team Workspace',
      owner: admin._id,
      members: [admin._id, member1._id, member2._id]
    });

    admin.workspaceIds = [workspace._id as mongoose.Types.ObjectId];
    await admin.save();
    member1.workspaceIds = [workspace._id as mongoose.Types.ObjectId];
    await member1.save();
    member2.workspaceIds = [workspace._id as mongoose.Types.ObjectId];
    await member2.save();

    const project1 = await Project.create({
      name: 'Q3 Marketing Website',
      description: 'Redesigning the main corporate site',
      owner: admin._id,
      members: [admin._id, member1._id, member2._id],
      workspaceId: workspace._id
    });

    const now = new Date();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    await Task.insertMany([
      { title: 'Design Landing Page', description: 'Figma mockups', project: project1._id, assignee: member1._id, status: 'Completed', deadline: past, priority: 'High', estimatedHours: 5, tags: ['Design', 'UI'] },
      { title: 'Setup Next.js Frontend', description: 'Init project', project: project1._id, assignee: member2._id, status: 'Completed', deadline: past, priority: 'Medium', estimatedHours: 3, tags: ['Code', 'Frontend'] },
      { title: 'Write Copywriting', description: 'Hero section text', project: project1._id, assignee: member1._id, status: 'In Progress', deadline: future, priority: 'Medium', estimatedHours: 4, tags: ['Content'] },
      { title: 'Deploy to Railway', description: 'Setup CD', project: project1._id, assignee: member2._id, status: 'Todo', deadline: past, priority: 'High', estimatedHours: 2, tags: ['DevOps'] },
      { title: 'Database Schema', description: 'MongoDB models', project: project1._id, assignee: member2._id, status: 'Todo', deadline: past, priority: 'High', estimatedHours: 6, tags: ['Backend'] },
      { title: 'API Documentation', description: 'Swagger docs', project: project1._id, assignee: member1._id, status: 'Review', deadline: future, priority: 'Low', estimatedHours: 2, tags: ['Docs'] },
    ]);

    console.log('Demo data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
