const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	EmbedBuilder,
} = require('discord.js');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config({ quiet: true });
const cooldown = new Map();
const Sentry = require('@sentry/node');
const serverDB = require('../models/server_db');
// for using sentry
require('../instrument');
const urlLimit = parseInt(process.env.url_limit) || 10;

// Sleep関数の定義
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

//URLチェックの動作を指定
async function getSafe(urls, message) {
	try {
		for (const url of urls) {
			const requestURL = `https://safeweb.norton.com/safeweb/sites/v1/details?url=${encodeURIComponent(url)}&insert=0`;

			const res = await fetch(requestURL);

			// Norton safe webのAPIのステータスを取得し、エラーハンドリング
			if (!res.ok) {
				Sentry.setTag('Error Point', 'NortonSafeWebAPI');
				Sentry.captureException(
					new Error(
						`Norton Safe Web API returned status ${res.status} for URL: ${url}`,
					),
				);
				continue; // APIリクエストに失敗した場合は、そのURLの処理をスキップして次のURLへ
			}
			let responseData;
			try {
				responseData = await res.json();
			} catch (err) {
				Sentry.setTag('Error Point', 'NortonSafeWebAPIParseToJSON');
				Sentry.captureException(err);
				continue; // JSONのパースに失敗した場合は、そのURLの処理をスキップして次のURLへ
			}

			let status = null;
			if (responseData.rating === 'b') {
				status = '危険な';
			} else if (responseData.rating === 'w') {
				status = '注意が必要な';
			} else if (responseData.rating === 'r' || responseData.rating === 'g') {
				status = 'safe';
			} else if (responseData.rating === 'u') {
				status = '安全性が不明な';
			} else {
				status = '安全性が不明な';
			}

			// 安全でないURLを検知したら即座に警告して処理を終了
			if (status !== 'safe') {
				const isCritical = status === '危険な' || status === '注意が必要な';
				const isUnknown = status === '安全性が不明な';
				const embed = new EmbedBuilder()
					.setTitle(`⚠⚠⚠${status}URLを検知しました！⚠⚠⚠`)
					.setDescription(
						`<@${message.author.id}> が投稿した内容には、__${status}URLが含まれる可能性が高いです__\n\n__**${
							isCritical
								? '絶対に、アクセスしないでください!'
								: '注意してアクセスしてください!'
						}**__`,
					)
					.setColor(isCritical ? 0xff0000 : isUnknown ? 0xffff00 : 0x717375)
					.setFooter({
						text: '※アクセスする際は、自己責任でお願いいたします。また、短縮URLの場合、実際のURLと異なる評価がされる可能性がありますので、ご注意ください。※',
					});

				return message.reply({
					embeds: [embed],
				});
			}

			// APIのレート制限を考慮して、リクエスト間に少し待機時間を設ける
			await sleep(2500);
		}

		// 全てのURLが安全な場合はリアクションを追加
		await message.react('✅');
	} catch (err) {
		Sentry.setTag('Error Point', 'urlCheck');
		Sentry.captureException(err);
	}
}

// 特定のキーと値に一致するエントリを抽出する関数
function filterMapByKeyValue(map, key, value) {
	const result = new Map();
	for (const [mapKey, mapValue] of map.entries()) {
		if (mapValue[key].startsWith(value)) {
			result.set(mapKey, mapValue);
		}
	}
	return result;
}

module.exports = async (client, message) => {
	try {
		if (message.author.bot) return;
		if (!message.guild) return;

		const myPermissions = message.guild.members.me
			.permissionsIn(message.channel)
			.toArray();
		const conditions = [
			'ViewChannel',
			'SendMessages',
			'ManageMessages',
			'EmbedLinks',
			'AttachFiles',
		];
		for (const key in conditions) {
			if (!myPermissions.includes(conditions[key])) {
				return;
			}
		}

		//危険なURLに警告
		const urls = (String(message.content).match(/https?:\/\/[^\s<>"`]+/g) || [])
			.map((url) => url.replace(/[.,!?;:'"\])}、。！？」』）］｝]+$/u, ''))
			.filter(Boolean);
		if (urls.length) {
			getSafe(urls.slice(0, urlLimit), message);
		}

		//メッセージ展開
		const messageURLRegex =
			/https?:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
		const matches = messageURLRegex.exec(message.content);
		if (matches) {
			const [url, guildId, channelId, messageId] = matches;

			// セキュリティチェック: 抽出されたguildIdが現在のguildIdと一致するかを確認
			if (guildId !== message.guild.id) return; // 異なるサーバーのメッセージは展開しない

			// サーバー設定で有効化されているか確認
			const server = await serverDB.findById(message.guild.id);
			if (!server || !server.message_expand) return; // サーバー設定が存在しない、またはメッセージ展開が無効の場合は終了

			try {
				const channel = await client.channels.fetch(channelId);
				const fetchedMessage = await channel.messages.fetch(messageId);

				// button生成
				const guideButton = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setLabel('メッセージを見る')
						.setURL(fetchedMessage.url)
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setCustomId('cancel')
						.setEmoji('🗑️')
						.setStyle(ButtonStyle.Secondary),
				);
				const notificationButton = new ActionRowBuilder();

				const embed = new EmbedBuilder()
					.setURL(fetchedMessage.url)
					.setDescription(
						fetchedMessage.content ? fetchedMessage.content : '\u200B', //contentに何もなければゼロ幅スペースを入力
					)
					.setAuthor({
						name: fetchedMessage.author.tag,
						iconURL: fetchedMessage.author.displayAvatarURL(),
					})
					.setColor(0x4d4df7)
					.setTimestamp(new Date(fetchedMessage.createdTimestamp));

				// 添付ファイル関連処理
				const imageEmbed = [];
				if (fetchedMessage.attachments.size > 0) {
					// 画像添付ファイル処理
					const attachedImages = filterMapByKeyValue(
						fetchedMessage.attachments,
						'contentType',
						'image/',
					);
					if (attachedImages.size >= 2) {
						attachedImages.forEach((attachedImage) => {
							const attachmentField = {
								url: fetchedMessage.url,
								image: {
									url: attachedImage.url,
								},
							};
							imageEmbed.push(attachmentField);
						});
					}
					if (attachedImages.size > 4) {
						notificationButton.addComponents(
							new ButtonBuilder()
								.setCustomId('dummy0')
								.setEmoji('⚠️')
								.setLabel('元メッセージに5枚以上の画像あり')
								.setDisabled(true)
								.setStyle(ButtonStyle.Secondary),
						);
					}

					// 画像以外の添付ファイル処理
					if (fetchedMessage.attachments.size !== attachedImages.size) {
						notificationButton.addComponents(
							new ButtonBuilder()
								.setCustomId('dummy1')
								.setEmoji('⚠️')
								.setLabel('元メッセージに画像以外の添付ファイルあり')
								.setDisabled(true)
								.setStyle(ButtonStyle.Secondary),
						);
					}
				}

				// 埋め込みがある場合
				if (fetchedMessage.embeds.length) {
					notificationButton.addComponents(
						new ButtonBuilder()
							.setCustomId('dummy2')
							.setEmoji('⚠️')
							.setLabel('元メッセージに埋め込みあり')
							.setDisabled(true)
							.setStyle(ButtonStyle.Secondary),
					);
				}

				message.channel.send({
					embeds: [embed].concat(imageEmbed),
					components: notificationButton.components.length
						? [guideButton, notificationButton]
						: [guideButton],
				});

				//メッセージリンクだけが投稿された場合の処理
				if (url === message.content) {
					message.delete().catch((_err) => {
						// 削除できなくても無視
					});
				}
			} catch (err) {
				Sentry.setTag('Error Point', 'messageExpansion');
				Sentry.captureException(err);
				return;
			}
		}

		// プレフィクスが要らない系コマンド
		if (
			message.content.match(/jinbeおはよう/) ||
			message.content.match(/おはようjinbe/)
		) {
			message.channel.send('おはよう！');
		} else if (
			message.content.match(/jinbeこんにちは/) ||
			message.content.match(/こんにちはjinbe/)
		) {
			message.channel.send('こんにちわああああ！');
		} else if (
			message.content.match(/jinbeこんばんは/) ||
			message.content.match(/こんばんはjinbe/)
		) {
			message.channel.send('こんばんわ！！');
		} else if (
			message.content.match(/jinbeおやすみ/) ||
			message.content.match(/おやすみjinbe/)
		) {
			message.channel.send('おやすみ～\nいい夢見てね…');
		} else if (
			/^omikuji$|^jinbe$|^omikujinbe$|^janken$/.test(message.content)
		) {
			// ここのコードは、チャット入力コマンドがスラッシュコマンドに仕様変更になったことによる案内文を表示するコード
			const guildId = message.guild.id;
			const now = Date.now();
			const cooldownAmount = 24 * 60 * 60 * 1000; // 1週間

			if (!cooldown.has(guildId) || now > cooldown.get(guildId)) {
				const deleteButton = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setLabel('このメッセージを削除する')
						.setEmoji('🗑️')
						.setCustomId('delete')
						.setStyle(ButtonStyle.Secondary),
				);
				message.reply({
					content:
						'申し訳ございません。「omikuji」、「jinbe」、「omikujinbe」、「janken」を利用したおみくじやじゃんけんは、スラッシュコマンドに移行しました。\n`/omikuji`や`/janken`、`/jinbe`コマンドをご利用ください。',
					components: [deleteButton],
					flags: MessageFlags.Ephemeral,
				});

				cooldown.set(guildId, now + cooldownAmount);
				setTimeout(() => cooldown.delete(guildId), cooldownAmount);
			}
		}
	} catch (err) {
		Sentry.setTag('Error Point', 'messageCreate');
		Sentry.captureException(err);
	}
};
