const mongoose = require("mongoose"); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //ユーザーID(桁数の都合上Stringで管理する)
    serverIDs: [{ type: String }], //サーバーID(桁数の都合上Stringで管理する)
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
