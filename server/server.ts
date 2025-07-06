import express from "express";
import cors from "cors";
import { sequelize } from "./database";
import authRoutes from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/Auth", authRoutes);

sequelize.sync().then(() => {
  app.listen(5000, () => {
    console.log(`Server running on port 5000`);
  });
});
