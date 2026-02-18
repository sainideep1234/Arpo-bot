import type { password } from "bun";
import mongoose, { Schema, model, models } from "mongoose";
import { email } from "zod";

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String, unique: true },
  thread_id: [{ type: Schema.Types.ObjectId, ref: "Threads" }],
});
const threadSchema = new Schema({
  title: { type: String },
  messages: [{ type: Schema.Types.ObjectId, ref: "Messages" }],
  authors: [{ type: Schema.Types.ObjectId, ref: "Users" }],
});

const messageSchema = new Schema({
  message_description: { type: String },
  image_url: { type: String },
  role: { type: String, enum: ["agent", "user", "developer"] },
  thread_id: { type: Schema.Types.ObjectId, ref: "Threads" },
});

export const Users = model("users", userSchema);
export const Threads = model("threads", threadSchema);
export const Messages = model("messages", messageSchema);
