const {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const packageInfo = require("../package.json");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "help",
  description: "❓このBOTのコマンドをご紹介します！",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "type",
      description: "何の情報を表示しますか",
      required: false,
      choices: [
        { name: "スラッシュコマンド系", value: "slashCommand" },
        { name: "チャットコマンド系", value: "chatCommand" },
      ],
    },
  ],

  run: async (client, interaction) => {
    try {
      await interaction.deferReply();
      let type = interaction.options.getString("type");

      if (type == "slashCommand") {
        let title = "スラッシュコマンド";
        let desc = `- \`/birthday_register\`：あなたの誕生日を登録して、<@988951430075396167>に祝ってもらう！！\n
        - \`/birthday_show < 全体か個人か > [個人の場合は、誰の誕生日を表示するか]\`：登録済みの誕生日の情報を表示します。\n
        - \`/happy_birthday < 誕生日を祝いたい相手を指定 > \`：いつでもどこでも、ハッピーバースデー！\n
        - \`/5000choyen\`：「5000兆円　欲しい！」の画像が作れます。\n
        - \`/server_settings\`：このサーバーで誕生日をお祝いする機能を有効にするか設定できます。
        __※管理者権限が必須です！__\n
        - \`/help\`：このメッセージを表示します。\n
        - \`/code\`：このBOTのプログラムを全公開！(笑)\n`;
        send(title, desc);
      } else if (type == "chatCommand") {
        let title = "チャットコマンド";
        let desc = `## 以下のメッセージが含まれるメッセージが送信された場合、それに返事をします。
        - \`jinbeおはよう\`
        - \`おはようjinbe\`
        - \`jinbeこんにちは\`
        - \`こんにちはjinbe\`
        - \`jinbeこんばんは\`
        - \`こんばんはjinbe\`
        - \`jinbeおやすみ\`
        - \`おやすみjinbe\`!`;
        send(title, desc);
      } else {
        let title = "このBOTについて";
        let desc = "作成：Hoshimikan6490";
        send(title, desc);
      }

      async function send(title, desc) {
        let buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(
              "https://discord.com/api/oauth2/authorize?client_id=988951430075396167&permissions=274878032960&scope=bot+applications.commands"
            )
            .setLabel("BOTを招待する")
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("サポートサーバーに参加する")
            .setURL("https://discord.gg/uYYaVRuUuJ"),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("このBOTのコードを見る")
            .setURL("https://github.com/mcee-jinbe/main_for_koyeb")
        );

        await interaction.editReply({
          embeds: [
            {
              title: `HELP(${title})`,
              description: desc,
              color: 0x227fff,
              timestamp: new Date(),
              thumbnail: {
                url: "attachment://file.png",
              },
              footer: {
                text: `バージョン： ${packageInfo.version}`,
              },
            },
          ],
          files: [
            {
              attachment: "images/jinbe_yoshi.png",
              name: "file.png",
            },
          ],
          components: [buttons],
        });
      }
    } catch (err) {
      Sentry.setTag("Error Point", "help");
      Sentry.captureException(err);
    }
  },
};
