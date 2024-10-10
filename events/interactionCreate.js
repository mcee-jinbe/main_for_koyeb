const { InteractionType } = require("discord.js");
const fs = require("fs");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction?.reply({
        content:
          "❌ このBOTはサーバー内でのみ動作します。\nお手数をおかけしますが、サーバー内でご利用ください。",
        ephemeral: true,
      });
    } else {
      if (interaction?.type == InteractionType.ApplicationCommand) {
        fs.readdir("./commands", (err, files) => {
          if (err) throw err;
          files.forEach(async (f) => {
            let props = require(`../commands/${f}`);
            if (interaction.commandName == props.name) {
              try {
                return props.run(client, interaction);
              } catch (err) {
                return interaction?.reply({
                  content: `❌ 何らかのエラーが発生しました。`,
                  ephemeral: true,
                });
              }
            }
          });
        });
      }

      if (interaction?.type == InteractionType.MessageComponent) {
        let buttonId = interaction.customId;
        var secret;
        if (buttonId.includes("secret")) {
          secret = true;
        } else {
          secret = false;
        }

        if (
          buttonId.includes("omi1") ||
          buttonId.includes("omi2") ||
          buttonId.includes("omi3")
        ) {
          await interaction.deferReply({
            ephemeral: secret,
          });

          const arr = [
            "大吉",
            "中吉",
            "小吉",
            "吉",
            "凶",
            "大凶",
            "じんべえ吉",
            "じんべえ凶",
          ];
          const random = Math.floor(Math.random() * arr.length);
          const result = arr[random];

          if (random === 0) {
            var file_pas = "images/jinbe_daikiti.png";
          } else if (random === 4 || random === 7) {
            var file_pas = "images/jinbe_pien.png";
          } else if (random === 5) {
            var file_pas = "images/jinbe_pien2.png";
          } else {
            var file_pas = "images/jinbe.png";
          }
          if (buttonId === "omi1") {
            var number = "1";
          } else if (buttonId === "omi2") {
            var number = "2";
          } else {
            var number = "3";
          }

          await interaction.editReply({
            embeds: [
              {
                title: "おみくじの結果！",
                description: `<@${interaction.user.id}>さんは、${result}を引きました！\n\n||\`ここだけの話、\`<@${interaction.user.id}> \`さんは、${number}を押したらしいよ...\`||`,
                color: 4817413,
                thumbnail: {
                  url: "attachment://omi_kekka.png",
                },
              },
            ],
            files: [{ attachment: file_pas, name: "omi_kekka.png" }],
          });
        }

        if (buttonId == "cancel" || buttonId == "delete") {
          await interaction.message.delete();
        }
      }
    }
  } catch (err) {
    err.id = "interactionCreate";
    const errorNotification = require("../errorFunction.js");
    errorNotification(client, interaction, err);
  }
};
