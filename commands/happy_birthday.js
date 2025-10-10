const { ApplicationCommandOptionType, MessageFlags } = require('discord.js');
const cooldown = new Map();
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	name: 'happy_birthday',
	description:
		'🎊いつでもどこでもハッピーバースデー(相手にメンションが送られます)',
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: 'user',
			description: '誰の誕生日を祝いますか？',
			required: true,
		},
	],

	run: (client, interaction) => {
		try {
			const user = interaction.options.getUser('user');
			const now = Date.now();
			const cooldownAmount = 60 * 1000; // 1分（60秒）

			if (cooldown.has(user.id)) {
				const expirationTime = cooldown.get(user.id);
				if (now < expirationTime) {
					return interaction.reply({
						content: `申し訳ございません。本コマンドはスパム対策のため、一定時間の間に1ユーザーに対して実行できる回数を制限しております。少し待ってもう一度お試しください。`,
						flags: MessageFlags.Ephemeral,
					});
				}
			}

			cooldown.set(user.id, now + cooldownAmount);
			setTimeout(() => cooldown.delete(user.id), cooldownAmount);

			return interaction.reply({
				content: `<@${user.id}>`,
				embeds: [
					{
						title: '🎊たんおめ！🎊',
						description: `<@${user.id}>さん お誕生日おめでとうございます！`,
						color: 0xff30ff,
						timestamp: new Date(),
					},
				],
			});
		} catch (err) {
			Sentry.setTag('Error Point', 'happy_birthday');
			Sentry.captureException(err);
		}
	},
};
