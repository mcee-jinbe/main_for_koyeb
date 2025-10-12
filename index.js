// for using sentry
require('./instrument');

const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
	],
});
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });
const Sentry = require('@sentry/node');

//機密情報取得
const token = process.env.bot_token;
const mong_db_info = process.env.mongodb_token;
const PORT = 8000;

//サイト立ち上げ
app.get('/', (req, res) => {
	res.sendStatus(200);
});
app.listen(PORT, () => {
	console.log(`Running on https://jinbe2-hoshimikan.koyeb.app/`);
});

//コマンドをBOTに適応させる準備
client.commands = [];
fs.readdir('./commands', (err, files) => {
	if (err) Sentry.captureException(err);
	files.forEach((f) => {
		try {
			if (f.endsWith('.js')) {
				const props = require(`./commands/${f}`);
				const propsJson = props.data.toJSON();
				client.commands.push(propsJson);
				console.log(`コマンドの読み込みが完了: ${propsJson.name}`);
			}
		} catch (err) {
			Sentry.captureException(err);
		}
	});
});

//events読み込み
fs.readdir('./events', (_err, files) => {
	files.forEach((file) => {
		if (!file.endsWith('.js')) return;
		const event = require(`./events/${file}`);
		const eventName = file.split('.')[0];
		console.log(`クライアントイベントの読み込みが完了: ${eventName}`);
		client.on(eventName, event.bind(null, client));
		delete require.cache[require.resolve(`./events/${file}`)];
	});
});

//mongooseについて
mongoose.set('strictQuery', false);
mongoose
	.connect(mong_db_info, { dbName: 'Database' })
	.then(() => {
		console.log('データベースに接続したんだゾ');
	})
	.catch((err) => {
		Sentry.setTag('Error Point', 'DBconnection');
		Sentry.captureException(err);
	});

//Discordへの接続
client.login(token);
