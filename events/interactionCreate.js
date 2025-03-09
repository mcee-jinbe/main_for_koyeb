const { InteractionType, MessageFlags } = require("discord.js");
const fs = require("fs");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction?.reply({
        content:
          "❌ このBOTはサーバー内でのみ動作します。\nお手数をおかけしますが、サーバー内でご利用ください。",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      if (interaction?.type == InteractionType.ApplicationCommand) {
        fs.readdir("./commands", (err, files) => {
          if (err) Sentry.captureException(err);
          files.forEach(async (f) => {
            let props = require(`../commands/${f}`);
            if (interaction.commandName == props.name) {
              try {
                return props.run(client, interaction);
              } catch (err) {
                return interaction?.reply({
                  content: `❌ 何らかのエラーが発生しました。`,
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
          });
        });
      }

      if (interaction?.type == InteractionType.MessageComponent) {
        let buttonId = interaction.customId;
        let secret;
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
          // ボタンを押した後のグルグル表示をやめる
          await interaction.deferUpdate();

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

          let file_pas, number;
          if (random === 0) {
            file_pas = "images/jinbe_daikiti.png";
          } else if (random === 4 || random === 7) {
            file_pas = "images/jinbe_pien.png";
          } else if (random === 5) {
            file_pas = "images/jinbe_pien2.png";
          } else {
            file_pas = "images/jinbe.png";
          }
          if (buttonId === "omi1") {
            number = "1";
          } else if (buttonId === "omi2") {
            number = "2";
          } else {
            number = "3";
          }

          // おみくじのUIを削除する
          setTimeout(async () => {
            await interaction.deleteReply();
          }, 500);

          return interaction.followUp({
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
            flags: secret ? MessageFlags.Ephemeral : 0,
          });
        }

        if (buttonId == "cancel" || buttonId == "delete") {
          await interaction.message.delete();
        }
      }
    }
  } catch (err) {
    Sentry.setTag("Error Point", "interactionCreate");
    Sentry.captureException(err);
  }
};
