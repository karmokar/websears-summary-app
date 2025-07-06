import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";

export class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
}

User.init(
  {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, unique: true, allowNull: false },
  },
  { sequelize, modelName: "User" }
);
