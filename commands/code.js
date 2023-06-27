module.exports = {
  data: {
    name: "code",
    description: "🧬このプログラムの内容を全公開！",
  },
  async execute(interaction) {
    interaction.reply({
      embeds: [
        {
          title: "このBOTのプログラムはこちら",
          url: "https://github.com/mcee-jinbe/main_for-railway",
          description: "転用可",
          color: 0x227fff,
        },
      ],
    });
  },
};
