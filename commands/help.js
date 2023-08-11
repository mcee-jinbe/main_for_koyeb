const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  data: {
    name: "help",
    description: "❓このBOTのコマンドをご紹介します！",
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "type",
        description: "何の情報を表示しますか",
        required: true,
        choices: [
          { name: "スラッシュコマンド系", value: "slashcommand" },
          { name: "チャットコマンド系", value: "chatcommand" },
        ],
      },
    ],
  },
  async execute(interaction) {
    await interaction.deferReply();
    let type = interaction.options.getString("type");

    if (type == "slashcommand") {
      let title = "スラッシュコマンド";
      let desc =
        "`/birthday_register`：あなたの誕生日を登録して、<@988951430075396167>に祝ってもらう！！\n\n`/birthday_show <全体か個人か> [個人の場合は、誰の誕生日を表示するか]`：登録済みの誕生日の情報を表示します。\n\n`/happy_birthday <誕生日を祝いたい相手を指定>`：いつでもどこでも、ハッピーバースデー！\n\n`/1000choen`：「1000兆円　欲しい！」の画像が作れます。\n\n`/server_settings`：このサーバーで誕生日をお祝いする機能を有効にするか設定できます。\n　__※管理者権限が必須です！__\n\n`/help`：このメッセージを表示します。\n\n`/code`：このBOTのプログラムを全公開！(笑)\n\n";
      send(title, desc);
    } else {
      let title = "チャットコマンド";
      let desc =
        "`omikuji`：おみくじを引きます。\n`janken`：<@988951430075396167>とじゃんけんが出来ます。\n\n`mc!nendo_sakaime`：年度の境目を作成します\n　__※管理者権限が必須です！__\n\n`mc!about`：このBOTについて書かれています。\n\n`mc!ping`：このBOTのPing値を知ることが出来ます。\n　※このBOTのプロフィール欄にも書かれています。（定期更新）\n\n`mc!aisatu_list`：挨拶のリストを表示します。\n\n`mc!help_omikuji`：おみくじの詳しい使い方を表示します。";
      send(title, desc);
    }

    async function send(title, desc) {
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
          },
        ],
        files: [
          {
            attachment: "photos/jinbe_yoshi.png",
            name: "file.png",
          },
        ],
      });
    }
  },
};
