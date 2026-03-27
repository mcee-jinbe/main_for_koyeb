const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const userDB = require('../models/user_db.js');
const serverDB = require('../models/server_db.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('birthday_show')
		.setDescription('🖥データベースに登録された情報を表示します')
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('何の情報を表示しますか')
				.setRequired(true)
				.addChoices(
					{ name: 'サーバー全体', value: 'all' },
					{ name: '個人', value: 'user' },
				),
		)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription(
					'誰の情報を表示しますか？（「全体の情報を表示」を選んだ場合は、無視されます）',
				)
				.setRequired(false),
		),

	run: async (client, interaction) => {
		try {
			//誕生日を祝う機能が使えるか確認
			const server = await serverDB.findById(interaction.guild.id);
			if (!server) {
				return interaction.reply({
					content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
					flags: MessageFlags.Ephemeral,
				});
			}

			const birthdayCelebrateStatus =
				server.birthday_celebrate?.status ?? server.status ?? false;

			if (!birthdayCelebrateStatus) {
				return interaction.reply({
					content:
						'申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.deferReply();

				const showType = interaction.options.getString('type');
				const showUser = interaction.options.getUser('user');

				if (showType === 'all') {
					const users = await userDB.find({
						serverIDs: interaction.guild.id,
					});

					if (users.length) {
						const memberList = [];
						for (const key in users) {
							const userId = users[key]._id;
							const user = await client.users.fetch(userId);
							const username = user.username;
							const displayName = user.globalName;
							const pushText = `${displayName}(@${username})`;
							memberList.push(pushText);
						}
						return interaction.editReply({
							embeds: [
								{
									title: '現在、データベースに登録されているユーザー一覧',
									description: `\`\`\`\n${memberList.join('\n')}\n\`\`\``,
									color: 0xaad0ff,
									timestamp: new Date(),
								},
							],
						});
					} else {
						return interaction.editReply('誰も誕生日を登録していません。');
					}
				} else if (showType === 'user') {
					if (showUser !== null) {
						const isBot = (await client.users.fetch(showUser)).bot;
						if (!isBot) {
							const users = await userDB.findOne({
								_id: showUser.id,
								serverIDs: interaction.guild.id,
							});

							if (!users) {
								return interaction.editReply('誕生日が登録されていません。');
							} else {
								const databaseMonth = users.birthday_month;
								const databaseDay = users.birthday_day;

								return interaction.editReply({
									content: '',
									embeds: [
										{
											title: `${showUser.username}さんの情報`,
											description: `ユーザー名： \`${showUser.username}\`\nユーザーID： \`${showUser.id}\`\n誕生日(登録されたもの)： \`${databaseMonth}月${databaseDay}日\``,
										},
									],
								});
							}
						} else {
							return interaction.editReply({
								content: '',
								embeds: [
									{
										title: 'エラー！',
										description:
											'指定された対象は「<:bot:1050345033305436170>」です。\n残念ながら、私は彼らの誕生日を祝う事が出来ません。対象には人を選んでください。',
										color: 0xff0000,
									},
								],
							});
						}
					} else {
						return interaction.editReply({
							content: '',
							embeds: [
								{
									title: 'エラー！',
									description:
										'誕生日の情報を表示する対象を指定してください。\n　例)　`/birthday_show [個人]　[@Hoshimikan6490]`',
									color: 0xff0000,
								},
							],
						});
					}
				}
			}
		} catch (err) {
			Sentry.setTag('Error Point', 'birthdayShow');
			Sentry.captureException(err);
		}
	},
};
