const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const userDB = require('../models/user_db.js');
const serverDB = require('../models/server_db.js');
require('dotenv').config({ quiet: true });
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('birthday_register')
		.setDescription('🔧誕生日を登録・更新しよう！')
		.addNumberOption((option) =>
			option
				.setName('month')
				.setDescription('誕生月を入力してください（半角数字で入力）')
				.setRequired(true),
		)
		.addNumberOption((option) =>
			option
				.setName('day')
				.setDescription('誕生日を入力してください(半角数字で入力)')
				.setRequired(true),
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

			const birthdayCelebrateStatus = server.birthday_celebrate.status;

			if (!birthdayCelebrateStatus) {
				return interaction.reply({
					content:
						'申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });

				// スラッシュコマンドの入力情報を取得
				const newBirthdayMonth = interaction.options.getNumber('month');
				const newBirthdayDay = interaction.options.getNumber('day');
				// 2月29日を登録できるようにするために、うるう年の日付データを取得する。
				const lastDay = new Date(2020, newBirthdayMonth, 0).getDate();

				const userId = interaction.user.id;

				if (newBirthdayMonth >= 1 && newBirthdayMonth <= 12) {
					if (newBirthdayDay >= 1 && newBirthdayDay <= lastDay) {
						const users = await userDB.findById(userId);
						if (!users) {
							// ユーザーDBに居ない場合は、新規登録
							const profile = await userDB.create({
								_id: userId,
								serverIDs: [interaction.guild.id],
								user_name: interaction.user.username,
								birthday_month: newBirthdayMonth,
								birthday_day: newBirthdayDay,
								finished: false,
							});
							profile
								.save()
								.catch((err) => {
									Sentry.captureException(err);
									return interaction.editReply(
										`申し訳ございません。内部エラーが発生しました。\n開発者(<@${process.env.botOwner}>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。`,
									);
								})
								.then(() => {
									return interaction.editReply({
										embeds: [
											{
												title: '新規登録完了！',
												description: `あなたの誕生日を\`${newBirthdayMonth}月${newBirthdayDay}日\`に設定しました。`,
												color: 0x0000ff,
											},
										],
										flags: MessageFlags.Ephemeral,
									});
								});
						} else {
							// ユーザーDBに居る場合は、更新手続きを行う。
							// ユーザーDBのserverIDsに登録されていない場合は、登録する。
							let registered = true;
							if (!users.serverIDs.includes(interaction.guild.id)) {
								registered = false;
								await userDB.updateOne(
									{ _id: userId },
									{ $push: { serverIDs: interaction.guild.id } },
								);
							}

							// 古い情報を取得
							const oldMonth = users.birthday_month;
							const oldDay = users.birthday_day;
							// 内容を更新
							users.birthday_month = newBirthdayMonth;
							users.birthday_day = newBirthdayDay;
							users.finished = false;
							users.save().then(() => {
								return interaction.editReply({
									embeds: [
										{
											title: registered
												? '全サーバーにおける、誕生日の更新が完了しました！'
												: 'このサーバーでのあなたの誕生日を祝う設定を有効にし、全サーバーにおける、誕生日の更新が完了しました！',
											description: `あなたの誕生日を\`${oldMonth}月${oldDay}日\`から\`${newBirthdayMonth}月${newBirthdayDay}日\`に更新しました。`,
											color: 0x10ff00,
										},
									],
								});
							});
						}
					} else {
						return interaction.editReply({
							embeds: [
								{
									title: 'エラー！',
									description: `${newBirthdayMonth}月には、最大で${lastDay}日までしか存在しません。\n正しい月日使用して再度お試しください。`,
									color: 0xff0000,
								},
							],
						});
					}
				} else {
					return interaction.editReply({
						embeds: [
							{
								title: 'エラー！',
								description: `1年は1～12月までしか存在しません。\n正しい月日を使用して再度お試しください。`,
								color: 0xff0000,
							},
						],
					});
				}
			}
		} catch (err) {
			Sentry.setTag('Error Point', 'birthdayRegister');
			Sentry.captureException(err);
		}
	},
};
