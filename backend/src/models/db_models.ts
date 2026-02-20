import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  thread_id: [{ type: Schema.Types.ObjectId, ref: "Threads" }],
});
const threadSchema = new Schema(
  {
    title: { type: String },
    messages: [{ type: Schema.Types.ObjectId, ref: "Messages" }],
    authors: [{ type: Schema.Types.ObjectId, ref: "Users" }],
  },
  { timestamps: true },
);

const messageSchema = new Schema(
  {
    message_description: { type: String },
    role: { type: String, enum: ["agent", "user", "developer"] },
    thread_id: { type: Schema.Types.ObjectId, ref: "Threads" },
  },
  { timestamps: true },
);

export const Users = model("users", userSchema);
export const Threads = model("threads", threadSchema);
export const Messages = model("messages", messageSchema);
