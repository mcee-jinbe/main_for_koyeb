const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "janken",
  description: "✊✌️🖐️じゃんけんをしよう！！",

  run: async (client, interaction) => {
    try {
      const janken_choice = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pa")
          .setLabel("パー")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🖐"),
        new ButtonBuilder()
          .setCustomId("cho")
          .setLabel("チョキ")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✌"),
        new ButtonBuilder()
          .setCustomId("gu")
          .setLabel("グー")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("✊")
      );
      await interaction.reply({
        embeds: [
          {
            title: "↓何を出す？！↓",
            color: 0xff0000,
            thumbnail: {
              url: "attachment://file.png",
            },
            footer: {
              text: `画像：　じゃんけんのイラスト｜ツカッテ`,
            },
          },
        ],
        files: [{ attachment: "images/janken.png", name: "file.png" }],
        components: [janken_choice],
        ephemeral: true,
      });
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
