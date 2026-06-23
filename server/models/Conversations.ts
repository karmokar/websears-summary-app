import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";

sequelize.authenticate().then(() => {
  console.log("Conversations Database connected");
});

export class Conversation extends Model {
  public ID!: number;
  public title!: string;
  public userId!: number;
  public isPublic!: boolean;
  public shareToken!: string | null;
}

Conversation.init(
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    shareToken: { type: DataTypes.STRING, allowNull: true, unique: true },
  },
  {
    sequelize,
    modelName: "Conversation",
    tableName: "conversations",
    timestamps: true,
  },
);
