const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "1000choyen",
    description: "1000兆円画像生成",
  },

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("1000choyen")
      .setTitle("1000兆円画像生成(合計30文字以内で入力してください)");

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
    const filter = (mInteraction) => mInteraction.customId === "1000choyen";
    interaction
      .awaitModalSubmit({ filter, time: 360000 })
      .then(async (mInteraction) => {
        const top = mInteraction.fields.getTextInputValue("topInput");
        const bottom = mInteraction.fields.getTextInputValue("bottomInput");

        if (top.length + bottom.length > 30)
          return mInteraction.reply({
            content: `上側と下側の合計で30文字以内で入力してください。\n\nあなたが入力した文字列は以下の通りでした。\n\`\`\`\n- 上側：　${top}\n- 下側：　${bottom}\n\`\`\``,
            ephemeral: true,
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
        console.log(err);
      });
  },
};
