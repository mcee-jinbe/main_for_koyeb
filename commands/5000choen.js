const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	MessageFlags,
	LabelBuilder,
} = require('discord.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	name: '5000choyen',
	description: '5000兆円画像生成',

	run: async (client, interaction) => {
		try {
			const modal = new ModalBuilder()
				.setCustomId('5000choyen')
				.setTitle('5000兆円画像生成(合計30文字以内で入力してください)');

			const topInput = new LabelBuilder()
				.setLabel('上部文字列')
				.setDescription(
					'「5000兆円 欲しい!!」の「5000兆円」の部分に入る文字列を入力してください。',
				)
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('topInput')
						.setStyle(TextInputStyle.Short)
						.setPlaceholder('5000兆円')
						.setRequired(true),
				);

			const bottomInput = new LabelBuilder()
				.setLabel('下部文字列')
				.setDescription(
					'「5000兆円 欲しい!!」の「欲しい!!」の部分に入る文字列を入力してください。',
				)
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('bottomInput')
						.setStyle(TextInputStyle.Short)
						.setPlaceholder('欲しい!!')
						.setRequired(true),
				);

			modal.addLabelComponents(topInput, bottomInput);

			await interaction.showModal(modal);
			const filter = (mInteraction) => mInteraction.customId === '5000choyen';
			interaction
				.awaitModalSubmit({ filter, time: 360000 })
				.then((mInteraction) => {
					const top = mInteraction.fields.getTextInputValue('topInput');
					const bottom = mInteraction.fields.getTextInputValue('bottomInput');

					if (top.length + bottom.length > 30)
						return mInteraction.reply({
							content: `上側と下側の合計で30文字以内で入力してください。\n\nあなたが入力した文字列は以下の通りでした。\n\`\`\`\n- 上側： ${top}\n- 下側： ${bottom}\n\`\`\``,
							flags: MessageFlags.Ephemeral,
						});

					return mInteraction.reply({
						embeds: [
							{
								image: {
									url: `https://gsapi.cbrx.io/image?top=${encodeURIComponent(
										top,
									)}&bottom=${encodeURIComponent(bottom)}&type=png`,
								},
								footer: {
									text: '※しばらく待っても生成されない場合は、再生成をお試しください。\n※生成にはCyberRex氏のAPIを使用しています。',
								},
							},
						],
					});
				})
				.catch((err) => {
					// time理由のエラーは無視
					if (err.code === 'InteractionCollectorError' && err.reason === 'time')
						return;
					Sentry.setTag('Error Point', 'receive5000choyenModal');
					Sentry.captureException(err);
				});
		} catch (err) {
			Sentry.setTag('Error Point', '5000choyen');
			Sentry.captureException(err);
		}
	},
};
