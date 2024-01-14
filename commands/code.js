module.exports = {
  name: "code",
  description: "🧬このプログラムの内容を全公開！",

  run: async (client, interaction) => {
    try {
      interaction.reply({
        embeds: [
          {
            title: "このBOTのプログラムはこちら",
            url: "https://github.com/mcee-jinbe/main_for_koyeb",
            description: "転用可",
            color: 0x227fff,
          },
        ],
      });
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
