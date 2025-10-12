const Sentry = require('@sentry/node');
const { SlashCommandBuilder } = require('discord.js');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('BotのPingを測定します'),

	run: async (client, interaction) => {
		try {
			await interaction.reply(
				`WebSocketのPing: ${interaction.client.ws.ping}ms\nAPIのエンドポイントのPing: ...`,
			);

			const msg = await interaction.fetchReply();

			return interaction.editReply(
				`WebSocketのPing: ${
					interaction.client.ws.ping
				}ms\nAPIのエンドポイントのPing: ${
					msg.createdTimestamp - interaction.createdTimestamp
				}ms`,
			);
		} catch (err) {
			Sentry.setTag('Error Point', 'ping');
			Sentry.captureException(err);
		}
	},
};
