const {
	MessageFlags,
	PermissionsBitField,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
} = require('discord.js');
const userDB = require('../models/user_db.js');
const serverDB = require('../models/server_db.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('birthday_unregister')
		.setDescription('🔧このサーバーに登録した誕生日情報を削除します')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription(
					'誕生日データを削除するユーザーを指定します(サーバー管理者限定)',
				)
				.setRequired(false),
		),

	run: async (client, interaction) => {
		try {
			// ユーザー指定があればそれを使用する。管理者以外が実行した場合は強制的に実行者のデータを扱うようにする
			let targetUser = interaction.options.getUser('user');
			if (
				!interaction.member.permissions.has(
					PermissionsBitField.Flags.Administrator,
				) ||
				targetUser === null
			) {
				targetUser = interaction.user;
			}

			await interaction.deferReply({
				flags: MessageFlags.Ephemeral,
			});
			//誕生日を祝う機能が使えるか確認
			const server = await serverDB.findById(interaction.guild.id);
			if (!server) {
				return interaction.editReply({
					content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
					flags: MessageFlags.Ephemeral,
				});
			}

			if (!server.status) {
				return interaction.editReply({
					content:
						'申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				let user;
				try {
					user = await userDB.findById(targetUser.id);
				} catch (err) {
					await interaction.editReply({
						content:
							'そのユーザーのデータは見つかりませんでした。登録されていないか、既に削除された可能性があります。',
					});
					void err;
				}
				if (!user)
					return interaction.editReply({
						content:
							'そのユーザーのデータは存在しません。登録されていないか、既に削除された可能性があります。',
					});

				// 削除確認ボタン処理
				const embed = new EmbedBuilder()
					.setTitle('誕生日データ削除確認')
					.setDescription(
						`${targetUser}さんの誕生日データをこのサーバーから削除します。\nよろしいですか？`,
					)
					.setColor(0xff0000)
					.setFooter({ text: '※ボタンを押さないと削除されません。' });
				const button = new ActionRowBuilder().setComponents(
					new ButtonBuilder()
						.setCustomId('birthday_unregister_confirm')
						.setLabel('削除する')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('cancel')
						.setLabel('キャンセル')
						.setStyle(ButtonStyle.Secondary),
				);
				return interaction.editReply({
					embeds: [embed],
					components: [button],
				});
			}
		} catch (err) {
			Sentry.setTag('Error Point', 'birthday_unregister');
			Sentry.captureException(err);
		}
	},
};
