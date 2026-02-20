/**
 * Admin Seed Script
 *
 * Run with: bun src/scripts/seedAdmin.ts
 *
 * Creates a default admin account if one doesn't already exist.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Users } from "../models/db_models";

const ADMIN_EMAIL = "admin@arpo.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_NAME = "ARPO Admin";

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_DB_API_KEY!);
    console.log("[Seed] Connected to MongoDB");

    // Check if admin already exists
    const existing = await Users.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role === "admin") {
        console.log(`[Seed] Admin account already exists: ${ADMIN_EMAIL}`);
      } else {
        // Upgrade existing user to admin
        existing.role = "admin";
        await existing.save();
        console.log(`[Seed] Upgraded existing user to admin: ${ADMIN_EMAIL}`);
      }
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await Users.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`[Seed] ✅ Admin account created successfully!`);
    }

    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("  ADMIN CREDENTIALS");
    console.log("═══════════════════════════════════════");
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("");

    await mongoose.disconnect();
    console.log("[Seed] Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("[Seed] Error:", error);
    process.exit(1);
  }
}

seedAdmin();
