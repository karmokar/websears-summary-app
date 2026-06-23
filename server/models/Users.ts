import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";

//Authenticating Database Connected
sequelize.authenticate().then(() => {
  console.log("Database connected");
});
export class User extends Model {
  declare ID: number;
  declare Username: string;
  declare Email: string;
  declare Password: string;
  declare tokens: string | null;
  declare google_id: string | null;
  declare facebook_id: string | null;
}

User.init(
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Username: { type: DataTypes.STRING, unique: true, allowNull: false },
    Email: { type: DataTypes.STRING, unique: true, allowNull: false },
    Password: { type: DataTypes.STRING, allowNull: false },
    tokens: { type: DataTypes.TEXT, allowNull: true },
    google_id: { type: DataTypes.STRING, unique: true, allowNull: true },
    facebook_id: { type: DataTypes.STRING, unique: true, allowNull: true },
  },
  { sequelize, modelName: "User", tableName: "users", timestamps: true },
);
