import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  project: mongoose.Types.ObjectId;
  assignee: mongoose.Types.ObjectId;
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  deadline: Date;
  priority: 'Low' | 'Medium' | 'High';
  blockers: string[];
  estimatedHours: number;
  tags: string[];
  progress: number;
}

const taskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Todo', 'In Progress', 'Review', 'Completed'], default: 'Todo' },
    deadline: { type: Date },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    blockers: [{ type: String }],
    estimatedHours: { type: Number, default: 0 },
    tags: [{ type: String }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', taskSchema);
