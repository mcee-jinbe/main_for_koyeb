module.exports = {
  data: {
    name: "code",
    description: "🧬このプログラムの内容を全公開！",
  },
  async execute(interaction) {
    console.log("code");
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
  },
};
