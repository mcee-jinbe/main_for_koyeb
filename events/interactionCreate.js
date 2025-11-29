const {
	InteractionType,
	MessageFlags,
	EmbedBuilder,
	ApplicationCommandType,
} = require('discord.js');
const fs = require('fs');
const Sentry = require('@sentry/node');
const userDB = require('../models/user_db.js');
// for using sentry
require('../instrument');

module.exports = async (client, interaction) => {
	try {
		if (!interaction?.guild) {
			return interaction?.reply({
				content:
					'❌ このBOTはサーバー内でのみ動作します。\nお手数をおかけしますが、サーバー内でご利用ください。',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			if (interaction?.type === InteractionType.ApplicationCommand) {
				fs.readdir('./commands', (err, files) => {
					if (err) Sentry.captureException(err);
					files.forEach(async (f) => {
						const props = require(`../commands/${f}`);
						const propsJson = props.data.toJSON();

						// propsJsonがundefinedだった場合は、スラッシュコマンドとしてタイプ1に設定
						if (propsJson === undefined) {
							propsJson.type = ApplicationCommandType.ChatInput;
						}

						if (
							interaction.commandName === propsJson.name &&
							interaction.commandType === propsJson.type
						) {
							try {
								return props.run(client, interaction);
							} catch (err) {
								await interaction?.reply({
									content: `❌ 何らかのエラーが発生しました。`,
									flags: MessageFlags.Ephemeral,
								});
								throw err;
							}
						}
					});
				});
			}

			if (interaction?.type === InteractionType.MessageComponent) {
				const buttonId = interaction.customId;
				let secret;
				if (buttonId.includes('secret')) {
					secret = true;
				} else {
					secret = false;
				}

				if (
					buttonId.includes('omi1') ||
					buttonId.includes('omi2') ||
					buttonId.includes('omi3')
				) {
					// ボタンを押した後のグルグル表示をやめる
					await interaction.deferUpdate();

					const arr = [
						'大吉',
						'中吉',
						'小吉',
						'吉',
						'凶',
						'大凶',
						'じんべえ吉',
						'じんべえ凶',
					];
					const random = Math.floor(Math.random() * arr.length);
					const result = arr[random];

					let filePass, number;
					if (random === 0) {
						filePass = 'images/jinbe_daikiti.png';
					} else if (random === 4 || random === 7) {
						filePass = 'images/jinbe_pien.png';
					} else if (random === 5) {
						filePass = 'images/jinbe_pien2.png';
					} else {
						filePass = 'images/jinbe.png';
					}
					if (buttonId === 'omi1') {
						number = '1';
					} else if (buttonId === 'omi2') {
						number = '2';
					} else {
						number = '3';
					}

					// おみくじのUIを削除する
					setTimeout(async () => {
						await interaction.deleteReply();
					}, 500);

					return interaction.followUp({
						embeds: [
							{
								title: 'おみくじの結果！',
								description: `<@${interaction.user.id}>さんは、${result}を引きました！\n\n||\`ここだけの話、\`<@${interaction.user.id}> \`さんは、${number}を押したらしいよ...\`||`,
								color: 4817413,
								thumbnail: {
									url: 'attachment://omi_kekka.png',
								},
							},
						],
						files: [{ attachment: filePass, name: 'omi_kekka.png' }],
						flags: secret ? MessageFlags.Ephemeral : 0,
					});
				} else if (buttonId === 'birthday_unregister_confirm') {
					const user = await userDB.findById(
						interaction.message.embeds[0].description
							.split('<@')[1]
							.split('>')[0],
					);

					// 削除済みの場合はその旨を表示
					if (!user || user === null) {
						return interaction.update({
							content: 'そのユーザーのデータは既に削除されています。',
							embeds: [],
							components: [],
						});
					}

					// ユーザーDBに居る場合は、削除手続きを行う。
					user.serverIDs = user.serverIDs.filter((serverID) => {
						return serverID !== interaction.guild.id;
					});
					try {
						await user.save();

						const embed = new EmbedBuilder()
							.setTitle('誕生日データ削除完了')
							.setDescription(
								`このサーバーにおける、<@${user._id}>さんのデータの削除が完了しました。`,
							)
							.setColor(0x00ff00);

						await interaction.update({
							content: '',
							embeds: [embed],
							components: [],
						});

						// serverIDsが何もなければデータ削除
						if (user.serverIDs.length === 0) {
							await user.deleteOne();
						}
						return;
					} catch (err) {
						Sentry.setTag('Error Point', 'birthdayUnregisterSaveDB');
						Sentry.captureException(err);
						return interaction.update({});
					}
				}

				if (buttonId === 'cancel' || buttonId === 'delete') {
					// ボタンを押した後のグルグル表示をやめる
					await interaction.deferUpdate();
					// インタラクションの元のメッセージを削除する
					await interaction.deleteReply();
				}
			}
		}
	} catch (err) {
		Sentry.setTag('Error Point', 'interactionCreate');
		Sentry.captureException(err);
	}
};
