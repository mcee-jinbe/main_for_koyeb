const mongoose = require("mongoose"); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //サーバーID
    channelID: { type: Number }, //祝うチャンネルID
    status: { type: Boolean }, //祝う機能の有効/無効
  },
  {
    versionKey: false,
  }
);

const model = mongoose.model("server", profileSchema);

module.exports = model;
