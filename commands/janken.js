const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	SlashCommandBuilder,
} = require('discord.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('janken')
		.setDescription('✊✌️🖐️じゃんけんをしよう！！')
		.addStringOption((option) =>
			option
				.setName('secret')
				.setDescription('結果を非公開で送信したい場合は設定してください。')
				.setRequired(false)
				.addChoices({ name: '非公開にする', value: 'true' }),
		),

	run: (client, interaction) => {
		try {
			const secret = interaction.options.getString('secret') === 'true';
			const jankenChoice = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('pa')
					.setLabel('パー')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('🖐'),
				new ButtonBuilder()
					.setCustomId('cho')
					.setLabel('チョキ')
					.setStyle(ButtonStyle.Success)
					.setEmoji('✌'),
				new ButtonBuilder()
					.setCustomId('gu')
					.setLabel('グー')
					.setStyle(ButtonStyle.Danger)
					.setEmoji('✊'),
			);

			return interaction
				.reply({
					embeds: [
						{
							title: '↓何を出す？！↓',
							color: 0xff0000,
							thumbnail: {
								url: 'attachment://file.png',
							},
							footer: {
								text: `画像： じゃんけんのイラスト｜ツカッテ`,
							},
						},
					],
					files: [{ attachment: 'images/janken.png', name: 'file.png' }],
					components: [jankenChoice],
					flags: MessageFlags.Ephemeral,
				})
				.then((buttonMessage) => {
					const filter = (i) => i.user.id === interaction.user.id;
					const collector = buttonMessage.createMessageComponentCollector({
						filter,
						time: 120000,
					});

					collector.on('collect', (button) => {
						const buttonId = button?.customId;
						if (buttonId === 'gu' || buttonId === 'cho' || buttonId === 'pa') {
							// じんべえの手を決める
							const arr = ['pa', 'cho', 'gu'];
							const random = Math.floor(Math.random() * arr.length);
							const jinbe = arr[random];
							// 処理用の変数を用意
							let me,
								jankenResult,
								resultMe,
								resultJinbe,
								resultJa,
								color,
								filePass;
							// 自分の手を「me」に代入
							if (buttonId.includes('pa')) {
								me = 'pa';
							} else if (buttonId.includes('cho')) {
								me = 'cho';
							} else if (buttonId.includes('gu')) {
								me = 'gu';
							}
							// 結果判定
							// 自分がパーの時
							if (buttonId.includes('pa')) {
								if (jinbe === 'pa') {
									jankenResult = 'aiko';
								} else if (jinbe === 'cho') {
									jankenResult = 'lose';
								} else if (jinbe === 'gu') {
									jankenResult = 'win';
								}
								// 自分がチョキの時
							} else if (buttonId.includes('cho')) {
								if (jinbe === 'pa') {
									jankenResult = 'win';
								} else if (jinbe === 'cho') {
									jankenResult = 'aiko';
								} else if (jinbe === 'gu') {
									jankenResult = 'lose';
								}
							} else if (buttonId.includes('gu')) {
								// 自分がグーの時
								if (jinbe === 'pa') {
									jankenResult = 'lose';
								} else if (jinbe === 'cho') {
									jankenResult = 'win';
								} else if (jinbe === 'gu') {
									jankenResult = 'aiko';
								}
							}
							// 変数調整
							//me変数の日本語化
							if (me === 'pa') {
								resultMe = 'パー';
							} else if (me === 'cho') {
								resultMe = 'チョキ';
							} else if (me === 'gu') {
								resultMe = 'グー';
							}
							//jinbe変数の日本語化
							if (jinbe === 'pa') {
								resultJinbe = 'パー';
							} else if (jinbe === 'cho') {
								resultJinbe = 'チョキ';
							} else if (jinbe === 'gu') {
								resultJinbe = 'グー';
							}
							//結果の日本語化
							if (jankenResult === 'win') {
								resultJa = 'あなたの勝ち';
							} else if (jankenResult === 'aiko') {
								resultJa = 'あいこ';
							} else if (jankenResult === 'lose') {
								resultJa = 'あなたの負け';
							}
							// 色調整
							if (jankenResult === 'win') {
								color = 0xff0000;
							} else if (jankenResult === 'aiko') {
								color = 0xffff00;
							} else if (jankenResult === 'lose') {
								color = 0x0000ff;
							}
							// file Pass設定
							if (jankenResult === 'win') {
								filePass = 'images/win.png';
							} else if (jankenResult === 'aiko') {
								filePass = 'images/aiko.png';
							} else if (jankenResult === 'lose') {
								filePass = 'images/lose.png';
							}

							// じゃんけんのUIを削除する
							setTimeout(async () => {
								await interaction.deleteReply();
							}, 500);

							// 結果表示
							return interaction.followUp({
								embeds: [
									{
										title: 'じゃんけんの結果！',
										description: `<@${interaction.user.id}>さんは ${resultMe}を出して、\n私は ${resultJinbe}を出したので、\n\n__**${resultJa}です！**__`,
										color: color,
										thumbnail: {
											url: 'attachment://janken_kekka.png',
										},
									},
								],
								files: [{ attachment: filePass, name: 'janken_kekka.png' }],
								flags: secret ? MessageFlags.Ephemeral : 0,
							});
						}
					});
				})
				.catch((err) => {
					Sentry.setTag('Error Point', 'jankenCollection');
					Sentry.captureException(err);
				});
		} catch (err) {
			Sentry.setTag('Error Point', 'janken');
			Sentry.captureException(err);
		}
	},
};
