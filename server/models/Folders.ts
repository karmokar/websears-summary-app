import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";

sequelize.authenticate().then(() => {
  console.log("Folder Database connected");
});

export class Folder extends Model {
  public ID!: number;
  public Folder_Name!: string;
  public User_ID!: number;
  public isPublic!: boolean;
  public shareToken!: string | null;
}

Folder.init(
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Folder_Name: { type: DataTypes.STRING, allowNull: false },
    User_ID: { type: DataTypes.INTEGER, allowNull: false },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    shareToken: { type: DataTypes.STRING, allowNull: true, unique: true },
  },
  { sequelize, modelName: "Folder", tableName: "uploads", timestamps: true },
);
