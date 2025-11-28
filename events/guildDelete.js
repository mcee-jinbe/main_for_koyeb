const serverDB = require('../models/server_db.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

const errorNotificationChannelID = process.env.errorNotificationChannelID;

module.exports = async (client, guild) => {
	try {
		const serverInfo = await serverDB.findById(guild.id);

		if (!serverInfo) {
			client.channels.cache
				.get(errorNotificationChannelID)
				.send(
					`データベースに登録されていないサーバーから退出しました。オーナーIDは${guild.ownerId}、サーバーIDは${guild.id}`,
				);
		} else {
			await serverInfo.deleteOne();
			console.log('正常にサーバーから退出しました。');
		}
	} catch (err) {
		Sentry.setTag('Error Point', 'guildDelete');
		Sentry.captureException(err);
	}
};
