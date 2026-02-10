const { ActivityType, REST, Routes } = require('discord.js');
const userDB = require('../models/user_db.js');
const serverDB = require('../models/server_db.js');
const cron = require('node-cron');
const { formatToTimeZone } = require('date-fns-timezone');
const os = require('node:os');
require('dotenv').config({ quiet: true });
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

const token = process.env.bot_token;
const readyNotificationChannelID = process.env.readyNotificationChannelID;
const errorNotificationChannelID = process.env.errorNotificationChannelID;
const botOwner = process.env.botOwner;

//誕生日チェック
async function birthdayCheck(client) {
	const FORMAT = 'MM-DD';
	const now = new Date();
	const today = formatToTimeZone(now, FORMAT, { timeZone: 'Asia/Tokyo' });
	const todayMonth = today.split('-')[0];
	const todayDay = String(today.split('-')[1]);
	const model = await userDB.find({
		birthday_month: todayMonth,
		birthday_day: todayDay,
		finished: false,
	});

	if (!model.length) {
		console.log(
			`祝福されていない、今日(${todayMonth}月${todayDay}日)誕生日の人は確認できませんでした。`,
		);
		return;
	}

	// 誕生日を迎えた全ユーザー分ループする
	for (const key in model) {
		// めでたい人の情報を取得して定義
		const celebrateServerIDs = model[key].serverIDs;
		const birthdayPeopleID = model[key]._id;
		let dataDeleted = false;

		for (const celebrateServerID of celebrateServerIDs) {
			const serverInfo = await serverDB.findById(celebrateServerID);

			// サーバー設定で誕生日祝いが無効になっている場合、またはサーバー情報が取得できなかった場合
			if (!serverInfo || !serverInfo.status) {
				try {
					const celebratedUser = await client.users.fetch(birthdayPeopleID);
					const serverName = client.guilds.cache.get(celebrateServerID)?.name;

					await celebratedUser
						.send(
							`🎉お誕生日おめでとうございます！🎉\n\nサーバー「${serverName ? serverName : '不明なサーバー'}」において、誕生日を祝う機能が無効にされたため、誕生日を祝うことができませんでした。\nサーバー管理者に再設定を依頼してください。\n\n※なお、あなたのこのメッセージをもって、このサーバーに関連付けされたあなたの誕生日情報は削除されます。サーバー管理者が再設定したら、あなた自身も再度設定してください。`,
						)
						.catch((err) => {
							// エラーコード50007: ユーザーにDMを送信できません
							// エラーコード10013: ユーザーが見つかりません
							if (err.code === 50007 || err.code === 10013) {
								return;
							}
							// それ以外のエラーは再スロー（外側のtry/catchとSentryでキャッチされる）
							throw err;
						});
				} catch (err) {
					Sentry.setTag('Error Point', 'notifyUserBirthdayCelebrationDisabled');
					Sentry.captureException(err);
				}

				// ユーザーDBからの削除手続きを行う。
				model[key].serverIDs = model[key].serverIDs.filter((serverID) => {
					return serverID !== celebrateServerID;
				});
				try {
					await model[key].save();

					// serverIDsが何もなければデータ削除
					if (model[key].serverIDs.length === 0) {
						await model[key].deleteOne();
						dataDeleted = true;
						break; // 内側のループを抜ける
					}
				} catch (err) {
					Sentry.setTag('Error Point', 'unregisteredBirthdayFromUnknownServer');
					Sentry.captureException(err);
				}
			} else {
				//誕生日を祝う
				client.channels.cache.get(serverInfo.channelID).send({
					content: `<@${birthdayPeopleID}>`,
					embeds: [
						{
							title: 'お誕生日おめでとうございます！',
							description: `今日は、<@${birthdayPeopleID}>さんのお誕生日です！`,
							color: 0xff00ff,
							thumbnail: {
								url: 'attachment://happy_birthday.png',
							},
						},
					],
					files: [
						{
							attachment: './images/jinbe_ome.png',
							name: 'happy_birthday.png',
						},
					],
				});
			}
		}

		// データが削除された場合は、status更新をスキップ
		if (dataDeleted) continue;

		//status更新
		model[key].finished = true;
		try {
			await model[key].save();
		} catch (err) {
			Sentry.setTag('Error Point', 'birthdayStatusUpdateWhenCelebrated');
			Sentry.captureException(err);
			client.channels.cache
				.get(errorNotificationChannelID)
				.send(
					`<@${botOwner}>\n誕生日statusの更新時にエラーが発生しました。コンソールを確認してください。\n\nエラー情報: ユーザーID: ${birthdayPeopleID}`,
				);
		}
	}
}

module.exports = async (client) => {
	const rest = new REST({ version: '10' }).setToken(token);
	(async () => {
		try {
			await rest.put(Routes.applicationCommands(client.user.id), {
				body: await client.commands,
			});
			console.log('スラッシュコマンドの再読み込みに成功しました。');
		} catch (err) {
			console.log(
				`❌ スラッシュコマンドの再読み込み時にエラーが発生しました。`,
			);
			Sentry.captureException(err);
		}
	})();

	console.log(`${client.user.username}への接続に成功しました。`);

	//シャットダウン中に導入されたサーバーを登録
	const allGuilds = await client.guilds.cache.map((guild) => guild.id);
	const allServerData = await serverDB.find();
	const allServerDataIDs = allServerData.map((data) => data._id);
	for (const guildId of allGuilds) {
		//全DBのデータ内に参加中のサーバーIDが含まれない場合は登録処理を行う。
		if (!allServerDataIDs.includes(guildId)) {
			try {
				await serverDB.create({
					_id: guildId,
					channelID: null,
					status: false,
					message_expand: true,
				});
				console.log(
					'シャットダウン中に招待されたサーバーのデータを作成しました。',
				);
			} catch (err) {
				Sentry.captureException(err);
				client.channels.cache
					.get(errorNotificationChannelID)
					.send(
						'内部エラーが発生しました。\n新サーバーの登録時にエラーが発生しました。コンソールを確認してください。',
					);
			}
		}
	}

	//シャットダウン中に退出されたサーバーのデータ削除
	for (const id of allServerDataIDs) {
		//全参加中のサーバーの中で、データベースに登録されていないサーバーIDが含まれる場合は登録削除処理を行う。
		if (!allGuilds.includes(id)) {
			try {
				const data = await serverDB.findById(id);
				if (data) await data.deleteOne();
				console.log(
					'シャットダウン中に退出したサーバーのデータを削除しました。',
				);
			} catch (err) {
				Sentry.captureException(err);
				client.channels.cache
					.get(errorNotificationChannelID)
					.send(
						'内部エラーが発生しました。\nサーバーの削除時にエラーが発生しました。コンソールを確認してください。',
					);
			}
		}
	}

	birthdayCheck(client); //起動時に実行

	cron.schedule(
		'15 8 * * *',
		() => {
			//8:15に実行
			birthdayCheck(client);
		},
		{
			timezone: 'Asia/Tokyo',
		},
	);

	cron.schedule(
		'15 13 * * *',
		() => {
			//13:15に実行
			birthdayCheck(client);
		},
		{
			timezone: 'Asia/Tokyo',
		},
	);

	cron.schedule(
		'45 15 * * *',
		() => {
			//15:45に実行
			birthdayCheck(client);
		},
		{
			timezone: 'Asia/Tokyo',
		},
	);

	cron.schedule(
		'59 23 31 12 *',
		async () => {
			//12/31 23:59にリセット
			await userDB
				.find({ finished: true })
				.catch((err) => {
					Sentry.setTag('Error Point', 'birthdayStatusReset');
					Sentry.captureException(err);
					client.channels.cache
						.get(errorNotificationChannelID)
						.send(
							'内部エラーが発生しました。\n年末の誕生日statusのリセット時にエラーが発生しました。コンソールを確認してください。',
						);
					return;
				})
				.then(async (model) => {
					//status更新
					for (const key in model) {
						model[key].finished = false;
						try {
							await model[key].save();
							console.log('done');
						} catch (err) {
							Sentry.setTag('Error Point', 'birthdayStatusResetSaveDB');
							Sentry.captureException(err);
							return client.channels.cache
								.get(errorNotificationChannelID)
								.send(
									'内部エラーが発生しました。\n年末の誕生日statusのリセット時にエラーが発生しました。コンソールを確認してください。',
								);
						}
					}
				});
		},
		{
			timezone: 'Asia/Tokyo',
		},
	);
	//////////////////////////////////////////////

	setInterval(() => {
		client.user.setActivity(
			`所属サーバー数は、${client.guilds.cache.size}サーバー｜Ping値は、${
				client.ws.ping
			}ms｜${
				os.type().includes('Windows') ? '開発環境' : 'koyeb.com'
			}で起動中です`,
			{ type: ActivityType.Listening },
		);
	}, 10000);

	client.channels.cache
		.get(readyNotificationChannelID)
		.send(
			`${
				os.type().includes('Windows') ? '開発環境' : 'koyeb.com'
			}で起動しました！`,
		);
};
