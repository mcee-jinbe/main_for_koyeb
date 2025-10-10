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
async function birthday_check(client) {
	const FORMAT = 'MM-DD';
	const now = new Date();
	const today = formatToTimeZone(now, FORMAT, { timeZone: 'Asia/Tokyo' });
	const today_month = today.split('-')[0];
	const today_day = String(today.split('-')[1]);
	const model = await userDB.find({
		birthday_month: today_month,
		birthday_day: today_day,
		finished: false,
	});

	if (!model.length) {
		console.log(
			`祝福されていない、今日(${today_month}月${today_day}日)誕生日の人は確認できませんでした。`,
		);
		return;
	}

	// 誕生日を迎えた全ユーザー分ループする
	for (const key in model) {
		// めでたい人の情報を取得して定義
		const celebrate_server_ids = model[key].serverIDs;
		const birthday_people_id = model[key]._id;

		for (const celebrate_server_id of celebrate_server_ids) {
			const server_info = await serverDB.findById(celebrate_server_id);

			//誕生日を祝う
			client.channels.cache.get(server_info.channelID).send({
				content: `<@${birthday_people_id}>`,
				embeds: [
					{
						title: 'お誕生日おめでとうございます！',
						description: `今日は、<@${birthday_people_id}>さんのお誕生日です！`,
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

		//status更新
		model[key].finished = true;
		model[key].save().catch((err) => {
			Sentry.captureException(err);
			client.channels.cache
				.get(errorNotificationChannelID)
				.send(
					`<@${botOwner}>\n誕生日statusの更新時にエラーが発生しました。コンソールを確認してください。\n\nエラー情報: ユーザーID: ${birthday_people_id}`,
				);
			return;
		});
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
				await serverDB.deleteOne({ _id: id });
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

	birthday_check(client); //起動時に実行

	cron.schedule(
		'15 8 * * *',
		() => {
			//8:15に実行
			birthday_check(client);
		},
		{
			timezone: 'Asia/Tokyo',
		},
	);

	cron.schedule(
		'15 13 * * *',
		() => {
			//13:15に実行
			birthday_check(client);
		},
		{
			timezone: 'Asia/Tokyo',
		},
	);

	cron.schedule(
		'45 15 * * *',
		() => {
			//15:45に実行
			birthday_check(client);
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
				.then((model) => {
					//status更新
					for (const key in model) {
						model[key].finished = false;
						model[key]
							.save()
							.catch((err) => {
								Sentry.captureException(err);
								client.channels.cache
									.get(errorNotificationChannelID)
									.send(
										'内部エラーが発生しました。\n年末の誕生日statusのリセット時にエラーが発生しました。コンソールを確認してください。',
									);
								return;
							})
							.then(() => console.log('done'));
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
