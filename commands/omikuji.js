const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "omikuji",
  description: "🥠おみくじを引こう！！",

  run: async (client, interaction) => {
    try {
      const omikuji_choice = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("omi1")
          .setLabel("を引く")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("1️⃣"),
        new ButtonBuilder()
          .setCustomId("omi2")
          .setLabel("を引く")
          .setStyle(ButtonStyle.Success)
          .setEmoji("2️⃣"),
        new ButtonBuilder()
          .setCustomId("omi3")
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
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
