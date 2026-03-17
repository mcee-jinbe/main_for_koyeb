// for using sentry
require('./instrument');

const fs = require('fs');
const path = require('path');
const {
	Client,
	GatewayIntentBits,
	ApplicationCommandType,
} = require('discord.js');
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
const mongodbToken = process.env.mongodb_token;
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
client.commandHandlers = new Map();
try {
	const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'));
	for (const file of commandFiles) {
		if (!file.endsWith('.js')) continue;
		const props = require(`./commands/${file}`);
		const propsJson = props.data.toJSON();
		if (!propsJson.type) {
			propsJson.type = ApplicationCommandType.ChatInput;
		}
		client.commands.push(propsJson);
		client.commandHandlers.set(propsJson.name, props);
		console.log(`コマンドの読み込みが完了: ${propsJson.name}`);
	}
} catch (err) {
	Sentry.captureException(err);
}

//events読み込み
try {
	const eventFiles = fs.readdirSync(path.join(__dirname, 'events'));
	for (const file of eventFiles) {
		if (!file.endsWith('.js')) continue;
		const event = require(`./events/${file}`);
		const eventName = file.split('.')[0];
		console.log(`クライアントイベントの読み込みが完了: ${eventName}`);
		client.on(eventName, event.bind(null, client));
	}
} catch (err) {
	Sentry.captureException(err);
}

//mongooseについて
mongoose
	.connect(mongodbToken, { dbName: 'Database' })
	.then(() => {
		console.log('データベースに接続したんだゾ');
	})
	.catch((err) => {
		Sentry.setTag('Error Point', 'DBconnection');
		Sentry.captureException(err);
	});

//Discordへの接続
client.login(token);
