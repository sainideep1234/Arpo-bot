import { Router, type Request, type Response } from "express";
import { SigninSchema, SignupSchema } from "../utils/types";
import { Usage } from "@openai/agents";
import { Users } from "../models/db_models";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userRouter = Router();

userRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { success, data } = SigninSchema.safeParse(req.body);
    if (!success) {
      return res.status(401).json({
        success: false,
        message: "Please provide all fileds",
      });
    }

    const { email, password } = data;

    const user = await Users.findOne({ email });

    if (!user || user.password === "") {
      return res.status(401).json({
        success: false,
        message: "User is not exists , Please go to signUp page",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password!);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
    res.status(201).json({
      success: true,
      message: "User loginned succesfully",
      data: {
        token,
      },
    });
  } catch (error) {
    console.log("[ERROR]", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
});

userRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { success, data } = SignupSchema.safeParse(req.body);
    if (!success) {
      return res.status(401).json({
        success: false,
        message: "Please provide all fileds",
      });
    }

    const { email, password, name } = data;

    const user = await Users.findOne({ email });

    if (user) {
      return res.status(401).json({
        success: false,
        message: "User existed already. go to signIN ",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const dbUser = await Users.create({
      name,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign({ userId: dbUser._id }, process.env.JWT_SECRET!);

    res.status(201).json({
      success: true,
      message: "User loginned succesfully",
      data: {
        token,
      },
    });
  } catch (error) {
    console.log("[ERROR]", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
});

export default userRouter;
