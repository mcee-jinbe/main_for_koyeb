const {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "janken",
  description: "✊✌️🖐️じゃんけんをしよう！！",
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

      const janken_choice = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(secret ? "secret_pa" : "pa")
          .setLabel("パー")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🖐"),
        new ButtonBuilder()
          .setCustomId(secret ? "secret_cho" : "cho")
          .setLabel("チョキ")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✌"),
        new ButtonBuilder()
          .setCustomId(secret ? "secret_gu" : "gu") //TODO　　この後のInteractionCreateの処理を書く。また、omikujiも同じ事する
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
