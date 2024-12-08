const { ApplicationCommandOptionType } = require("discord.js");
const fs = require("fs");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "happy_birthday",
  description:
    "🎊いつでもどこでもハッピーバースデー(相手にメンションが送られます)",
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "誰の誕生日を祝いますか？",
      value: "user",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      let happyBirthday_sentUser = fs.readFileSync(
        "./happyBirthday_sentUser.json"
      );
      happyBirthday_sentUser = JSON.parse(happyBirthday_sentUser);

      if (!happyBirthday_sentUser.userId.includes(interaction.user.id)) {
        // 1分間使えなくなるようにする
        happyBirthday_sentUser.userId.push(interaction.user.id);
        fs.writeFileSync(
          "./happyBirthday_sentUser.json",
          JSON.stringify(happyBirthday_sentUser)
        );

        const user = interaction.options.getUser("user");
        await interaction.reply({
          content: `<@${user.id}>`,
          embeds: [
            {
              title: "🎊たんおめ！🎊",
              description: `<@${user.id}>さん　お誕生日おめでとうございます！`,
              color: 0xff30ff,
              timestamp: new Date(),
            },
          ],
        });

        //1分後にデータ削除して、再度コマンドを実行できるようにする
        setTimeout(() => {
          happyBirthday_sentUser.userId = happyBirthday_sentUser.userId.filter(
            (data) => data != interaction.user.id
          );
          fs.writeFileSync(
            "./happyBirthday_sentUser.json",
            JSON.stringify(happyBirthday_sentUser)
          );
        }, 60000);
      } else {
        return interaction.reply({
          content: `申し訳ございません。本コマンドはスパム対策のため、コマンド実行後一定時間このコマンドは使用できません。少し待ってもう一度お試しください。`,
          ephemeral: true,
        });
      }
    } catch (err) {
      err.id = "happy_birthday";
      Sentry.captureException(err);
    }
  },
};
