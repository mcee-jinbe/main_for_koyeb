const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
} = require('discord.js');
const packageInfo = require('../package.json');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('❓このBOTのコマンドをご紹介します！')
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('何の情報を表示しますか')
				.setRequired(false)
				.addChoices(
					{ name: 'スラッシュコマンド系', value: 'slashCommand' },
					{ name: 'チャットコマンド系', value: 'chatCommand' },
				),
		),

	run: async (client, interaction) => {
		try {
			await interaction.deferReply();
			const type = interaction.options.getString('type');

			if (type === 'slashCommand') {
				const title = 'スラッシュコマンド';
				const desc = `- </5000choyen:1338391425716326431>：「5000兆円 欲しい！」の画像が作れます。\n
        - </birthday_register:1176083075734716496>：あなたの誕生月日を登録して、<@${client.user.id}>に祝ってもらおう！！\n
        - </birthday_unregister:1352628247162257459>：あなたの誕生月日を登録解除します。なお、サーバー管理者は他のユーザーの登録解除も可能です。サーバー管理者以外が対象ユーザーを指定しても、入力は無視されます。\n
        - </birthday_show:1176083075734716497>：登録済みの誕生日情報を表示します。\n
        - </happy_birthday:1051836922609287272>：いつでもどこでも、ハッピーバースデー！(※選んだ相手をメンションします)\n
        - </help:1051836922609287273>：このヘルプメッセージを表示します。\n
        - </janken:1338391425716326432>：<@${client.user.id}>とじゃんけんをしよう！（<@${client.user.id}>と、こっそりじゃんけんをしたい場合は「非公開にする」を選択してください…）\n
        - </jinbe:1338391425716326433>：</omikuji:1338391425716326435>と同じ内容です。\n
        - </omikuji:1338391425716326435>：おみくじを引こう！（こっそりおみくじを引きたい場合は「非公開にする」を選択してください…）\n
        - </ping:1338391425716326436>：BOTとの通信状況を表示します。\n
        - </server_setting birthday_celebrate:1176083075734716498>：このサーバーで誕生日お祝い機能を有効にするかを設定できます。設定の際は、どのチャンネルで誕生日を祝うか指定する必要があります。\n
        - </server_setting message_expand:1176083075734716498>：このサーバーでメッセージ展開機能を有効にするかを設定できます。有効にすると、DiscordのメッセージURLが送信された際に、そのURLのメッセージ内容を表示するようになります。\n
        - </server_setting url_check:1176083075734716498>：このサーバーでURLの安全性チェック機能を有効にするかを設定できます。有効にすると、危険なURLが送信された際に警告を表示するようになります。安全性チェックで危険度が不明なURLが送信された場合に警告を表示するか否かの設定も可能です。\n
        - </server_setting show:1176083075734716498>：このサーバーの設定状況を表示します。\n\n
        __※\`/server_setting\`で始まるコマンドは、管理者権限が必須です！__\n`;
				send(title, desc);
			} else if (type === 'chatCommand') {
				const title = 'チャットコマンド';
				const desc = `## 以下のメッセージが含まれるメッセージが送信された場合、それに返事をします。
        - \`jinbeおはよう\`
        - \`おはようjinbe\`
        - \`jinbeこんにちは\`
        - \`こんにちはjinbe\`
        - \`jinbeこんばんは\`
        - \`こんばんはjinbe\`
        - \`jinbeおやすみ\`
        - \`おやすみjinbe\`
        `;
				send(title, desc);
			} else {
				const title = 'このBOTについて';
				const desc = '作成：Hoshimikan6490';
				send(title, desc);
			}

			function send(title, desc) {
				const buttons = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setURL(
							`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=274878032960&scope=bot+applications.commands`,
						)
						.setLabel('BOTを招待する')
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('サポートサーバーに参加する')
						.setURL('https://discord.gg/uYYaVRuUuJ'),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('このBOTのコードを見る')
						.setURL('https://github.com/HoshimiTech/JINBE'),
				);

				return interaction.editReply({
					embeds: [
						{
							title: `HELP(${title})`,
							description: desc,
							color: 0x227fff,
							timestamp: new Date(),
							thumbnail: {
								url: 'attachment://file.png',
							},
							footer: {
								text: `バージョン： ${packageInfo.version}`,
							},
						},
					],
					files: [
						{
							attachment: 'images/jinbe_yoshi.png',
							name: 'file.png',
						},
					],
					components: [buttons],
				});
			}
		} catch (err) {
			Sentry.setTag('Error Point', 'help');
			Sentry.captureException(err);
		}
	},
};
