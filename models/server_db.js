const mongoose = require("mongoose"); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema({
  _id: { type: String }, //サーバーID
  channelID: { type: String }, //祝うチャンネルID
  status: { type: String },
});

const model = mongoose.model("server", profileSchema);

module.exports = model;
