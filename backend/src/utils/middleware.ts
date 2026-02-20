import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Users } from "../models/db_models";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  role: string;
}

// ─── Auth Middleware ─── Verifies JWT and attaches userId + role to req
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please sign in.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }
    const decoded = jwt.verify(token, secret) as unknown as JwtPayload;

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// ─── Admin Middleware ─── Must be used AFTER authMiddleware
// Verifies the user has admin role
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // First check the JWT role claim
    if (req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Double-check against the database (in case role was revoked after token was issued)
    const user = await Users.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization check failed",
    });
  }
}
