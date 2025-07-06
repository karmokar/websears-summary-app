import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/Users";

const router = express.Router();

//Signup
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, email, password: hash });
      res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (err: any) {
      next("User already exists");
    }
  }
);

//Login

const loginHandler: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentails" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentails" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
    res.json({
      message: "Login Sucessful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    next(err);
  }
};
router.post("/Login", loginHandler);

export default router;
