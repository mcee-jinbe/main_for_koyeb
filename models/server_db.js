const mongoose = require('mongoose'); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema(
	{
		_id: { type: String }, //サーバーID(桁数の都合上Stringで管理する)
		birthday_celebrate: {
			status: { type: Boolean, default: false }, //誕生日お祝い機能の有効/無効
			channelID: { type: String, default: null }, //誕生日を祝うチャンネルID(桁数の都合上Stringで管理する)
		},
		message_expand: { type: Boolean, default: true }, //メッセージ展開機能の有効/無効
	},
	{
		versionKey: false,
	},
);

const model = mongoose.model('server', profileSchema);

module.exports = model;
