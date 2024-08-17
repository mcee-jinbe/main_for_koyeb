const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "happy_birthday",
  description:
    "🎊いつでもどこでもハッピーバースデー(相手にメンションがいきます)",
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
      const user = interaction.options.getUser("user");
      await interaction.reply({
        content: "<@" + user.id + ">",
        embeds: [
          {
            title: "🎊たんおめ！🎊",
            description:
              `<@${user.id}>さん　お誕生日おめでとうございます！`,
            color: 0xff30ff,
            timestamp: new Date(),
          },
        ],
      });
    } catch (err) {
      const errorNotification = require("../errorFunction.js");
      errorNotification(client, interaction, err);
    }
  },
};
