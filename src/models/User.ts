import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Member';
  workspaceIds: mongoose.Types.ObjectId[];
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
    workspaceIds: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
