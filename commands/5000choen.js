const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "5000choyen",
  description: "5000兆円画像生成",

  run: async (client, interaction) => {
    try {
      const modal = new ModalBuilder()
        .setCustomId("5000choyen")
        .setTitle("5000兆円画像生成(合計30文字以内で入力してください)");

      const topInput = new TextInputBuilder()
        .setCustomId("topInput")
        .setLabel("上部文字列")
        .setStyle(TextInputStyle.Short);

      const bottomInput = new TextInputBuilder()
        .setCustomId("bottomInput")
        .setLabel("下部文字列")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(topInput),
        new ActionRowBuilder().addComponents(bottomInput)
      );

      await interaction.showModal(modal);
      const filter = (mInteraction) => mInteraction.customId === "5000choyen";
      interaction
        .awaitModalSubmit({ filter, time: 360000 })
        .then(async (mInteraction) => {
          const top = mInteraction.fields.getTextInputValue("topInput");
          const bottom = mInteraction.fields.getTextInputValue("bottomInput");

          if (top.length + bottom.length > 30)
            return mInteraction.reply({
              content: `上側と下側の合計で30文字以内で入力してください。\n\nあなたが入力した文字列は以下の通りでした。\n\`\`\`\n- 上側：　${top}\n- 下側：　${bottom}\n\`\`\``,
              flags: MessageFlags.Ephemeral,
            });

          mInteraction.reply({
            embeds: [
              {
                image: {
                  url: `https://gsapi.cbrx.io/image?top=${encodeURIComponent(
                    top
                  )}&bottom=${encodeURIComponent(bottom)}&type=png`,
                },
              },
            ],
          });
        })
        .catch((err) => {
          Sentry.setTag("Error Point", "receive5000choyenModal");
          Sentry.captureException(err);
        });
    } catch (err) {
      Sentry.setTag("Error Point", "5000choyen");
      Sentry.captureException(err);
    }
  },
};
