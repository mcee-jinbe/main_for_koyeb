const mongoose = require("mongoose"); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema({
  uid: { type: String }, //ユーザーID
  serverID: { type: String }, //サーバーID
  user_name: { type: String }, //ユーザーネーム
  birthday_month: { type: String },
  birthday_day: { type: String },
  status: { type: String },
});

const model = mongoose.model("user", profileSchema);

module.exports = model;
