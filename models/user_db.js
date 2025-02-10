const mongoose = require("mongoose"); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //ユーザーID
    serverIDs: [{ type: String }], //サーバーID
    user_name: { type: String }, //ユーザーネーム
    birthday_month: { type: String },
    birthday_day: { type: String },
    status: { type: String },
  },
  {
    versionKey: false,
  }
);

const model = mongoose.model("user", profileSchema);

module.exports = model;
