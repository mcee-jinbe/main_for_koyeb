const mongoose = require("mongoose"); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //ユーザーID
    serverIDs: [{ type: Number }], //サーバーID
    user_name: { type: String }, //ユーザーネーム
    birthday_month: { type: Number }, //誕生月
    birthday_day: { type: Number }, //誕生日
    finished: { type: Boolean }, //誕生日を迎えたかどうか
  },
  {
    versionKey: false,
  }
);

const model = mongoose.model("user", profileSchema);

module.exports = model;
