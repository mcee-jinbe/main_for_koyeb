const {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "omikuji",
  description: "🥠おみくじを引こう！！",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "secret",
      description: "非公開で送信したい場合は設定してください。",
      required: false,
      choices: [{ name: "非公開にする", value: "true" }],
    },
  ],

  run: async (client, interaction) => {
    try {
      var secret = interaction.options.getString("secret");

      // String => Boolean
      var secret = secret == "true";

      const omikuji_choice = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(secret ? "secret_omi1" : "omi1")
          .setLabel("を引く")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("1️⃣"),
        new ButtonBuilder()
          .setCustomId(secret ? "secret_omi2" : "omi2")
          .setLabel("を引く")
          .setStyle(ButtonStyle.Success)
          .setEmoji("2️⃣"),
        new ButtonBuilder()
          .setCustomId(secret ? "secret_omi3" : "omi3")
          .setLabel("を引く")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("3️⃣")
      );
      await interaction.reply({
        embeds: [
          {
            title: "↓直感で押して！↓",
            color: 0xff0000,
            thumbnail: {
              url: "attachment://file.png",
            },
            footer: {
              text: `画像：　フリーイラスト素材集 ジャパクリップ`,
            },
          },
        ],
        files: [{ attachment: "images/omikuji.png", name: "file.png" }],
        components: [omikuji_choice],
        ephemeral: true,
      });
    } catch (err) {
      const errorNotification = require("../errorFunction.js");
      errorNotification(client, interaction, err);
    }
  },
};
