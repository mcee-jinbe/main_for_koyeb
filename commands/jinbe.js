const { SlashCommandBuilder } = require('discord.js');
const omikujiSystem = require('./omikuji.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jinbe')
		.setDescription('🥠おみくじを引こう！！')
		.addStringOption((option) =>
			option
				.setName('secret')
				.setDescription('結果を非公開で送信したい場合は設定してください。')
				.setRequired(false)
				.addChoices({ name: '非公開にする', value: 'true' }),
		),

	run: (client, interaction) => {
		try {
			///jinbeコマンドは、/omikujiコマンドのエイリアスとして使用する。
			const secret = interaction.options.getString('secret');
			return omikujiSystem.run(client, interaction, secret);
		} catch (err) {
			Sentry.setTag('Error Point', 'jinbe_omikuji');
			Sentry.captureException(err);
		}
	},
};
