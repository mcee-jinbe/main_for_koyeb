const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const serverDB = require('../models/server_db.js');
const userDB = require('../models/user_db.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server_setting')
		.setDescription('🛠️サーバーの設定を変更します')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('birthday_celebrate')
				.setDescription('誕生日を祝う機能の設定をします。')
				.addStringOption((option) =>
					option
						.setName('true_or_false')
						.setDescription(
							'登録して誕生日を祝う機能を有効にするか無効にするか選択してください。',
						)
						.setRequired(true)
						.addChoices(
							{ name: '有効にする', value: 'true' },
							{ name: '無効にする', value: 'false' },
						),
				)
				.addChannelOption((option) =>
					option
						.setName('channel')
						.setDescription(
							'誕生日を祝うチャンネルを指定してください。(有効に設定する場合のみ使用されます)',
						)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('message_expand')
				.setDescription('メッセージ展開機能の設定をします。')
				.addStringOption((option) =>
					option
						.setName('true_or_false')
						.setDescription(
							'メッセージ展開機能を有効にするか無効にするか選択してください。',
						)
						.setRequired(true)
						.addChoices(
							{ name: '有効にする', value: 'true' },
							{ name: '無効にする', value: 'false' },
						),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('show').setDescription('設定を閲覧します.'),
		),

	run: async (client, interaction) => {
		try {
			const subcommand = interaction.options.getSubcommand();
			await interaction.deferReply();

			// 管理者権限の確認
			if (
				!interaction.memberPermissions.has(
					PermissionsBitField.Flags.Administrator,
				)
			) {
				return interaction.editReply({
					content:
						'あなたは管理者権限を持っていないため、サーバー設定を変更できません。\n変更したい場合は、サーバー管理者にこのコマンドを実行するようにお願いしてください。',
				});
			}

			if (subcommand === 'birthday_celebrate') {
				const status =
					interaction.options.getString('true_or_false') === 'true';
				const channel = interaction.options.getChannel('channel');

				const server = await serverDB.findById(interaction.guild.id);
				if (!server) {
					return interaction.reply({
						content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
					});
				} else {
					let st;
					if (status) {
						if (channel) {
							st = channel.id;
						} else {
							return interaction.editReply({
								content: '⚠️誕生日を祝うチャンネルを指定してください。',
							});
						}
					} else {
						st = null;

						//このサーバーに関連する誕生日データを削除
						const data = await userDB.find({ serverIDs: interaction.guild.id });
						for (const userData of data) {
							userData.serverIDs.pull(interaction.guild.id);
							try {
								await userData.save();
							} catch (err) {
								Sentry.setTag('Error Point', 'birthdayCelebrateRemoveServerID');
								Sentry.captureException(err);
							}
						}
					}

					server.birthday_celebrate = {
						channelID: st,
						status,
					};
					try {
						await server.save();
						return interaction.editReply({
							embeds: [
								{
									title: '設定を更新しました！',
									color: 0x10ff00,
								},
							],
						});
					} catch (err) {
						Sentry.setTag('Error Point', 'birthdayCelebrateSaveDB');
						Sentry.captureException(err);
						return interaction.editReply({
							content:
								'申し訳ございません。内部エラーが発生しました。\n開発者が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nサーバー設定の更新時にエラーが発生しました。\nコンソールを確認してください。',
						});
					}
				}
			} else if (subcommand === 'message_expand') {
				const status =
					interaction.options.getString('true_or_false') === 'true';
				const server = await serverDB.findById(interaction.guild.id);

				if (!server) {
					return interaction.editReply({
						content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
					});
				} else {
					server.message_expand = status;
					try {
						await server.save();
						return interaction.editReply({
							embeds: [
								{
									title: `メッセージ展開設定を${status ? '有効' : '無効'}にしました！`,
									color: 0x10ff00,
								},
							],
						});
					} catch (err) {
						Sentry.setTag('Error Point', 'messageExpandSaveDB');
						Sentry.captureException(err);
						return interaction.editReply({
							content:
								'申し訳ございません。内部エラーが発生しました。\n開発者が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nサーバー設定の更新時にエラーが発生しました。\nコンソールを確認してください。',
						});
					}
				}
			} else if (subcommand === 'show') {
				const server = await serverDB.findById(interaction.guild.id);
				if (!server) {
					return interaction.editReply({
						content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
					});
				}

				const birthdayCelebrateStatus =
					server.birthday_celebrate?.status ?? server.status ?? false;
				const birthdayCelebrateChannelID =
					server.birthday_celebrate?.channelID ?? server.channelID ?? null;

				let status, channel;
				if (birthdayCelebrateStatus) {
					status = '有効(true)';
					channel = interaction.guild.channels.cache.find(
						(ch) => ch.id === birthdayCelebrateChannelID,
					);
					if (!channel) {
						channel = '`見つかりませんでした！`';
					}
				} else {
					status = '無効(false)';
					channel = '`(機能が無効のため、この項目は無効化されています)`';
				}

				return interaction.editReply({
					embeds: [
						{
							title: `${interaction.guild.name}の設定`,
							description: `- 誕生日を祝う機能： ${status}\n- 誕生日を祝うチャンネル: ${channel}\n\n- メッセージ展開機能: ${
								server.message_expand ? '有効(true)' : '無効(false)'
							}`,
							color: 0x00ffff,
						},
					],
				});
			}
		} catch (err) {
			Sentry.setTag('Error Point', 'serverSettings');
			Sentry.captureException(err);
		}
	},
};
