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
        if (
          interaction.customId === "omi1" ||
          interaction.customId === "omi2" ||
          interaction.customId === "omi3"
        ) {
          await interaction.deferReply({
            ephemeral: true,
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
          if (interaction.customId === "omi1") {
            var number = "1";
          } else if (interaction.customId === "omi2") {
            var number = "2";
          } else {
            var number = "3";
          }

          await interaction.editReply({
            content: `<@${interaction.user.id}>`,
            embeds: [
              {
                title: "おみくじの結果！",
                description: `あなたは、${result}を引きました！\n\n||\`ここだけの話、\`<@${interaction.user.id}> \`さんは、${number}を押したらしいよ...\`||`,
                color: 4817413,
                thumbnail: {
                  url: "attachment://omi_kekka.png",
                },
              },
            ],
            files: [{ attachment: file_pas, name: "omi_kekka.png" }],
          });
        }

        // じゃんけんの処理
        if (
          interaction.customId === "pa" ||
          interaction.customId === "cho" ||
          interaction.customId === "gu"
        ) {
          // じんべえの手を決める
          const arr = ["pa", "cho", "gu"];
          const random = Math.floor(Math.random() * arr.length);
          const jinbe = arr[random];
          // 自分の手を「me」に代入
          if (interaction.customId === "pa") {
            var me = "pa";
          } else if (interaction.customId === "cho") {
            var me = "cho";
          } else if (interaction.customId === "gu") {
            var me = "gu";
          }
          // 結果判定
          // 自分がパーの時
          if (interaction.customId === "pa") {
            if (jinbe === "pa") {
              var jan_result = "aiko";
            } else if (jinbe === "cho") {
              var jan_result = "lose";
            } else if (jinbe === "gu") {
              var jan_result = "win";
            }
            // 自分がチョキの時
          } else if (interaction.customId === "cho") {
            if (jinbe === "pa") {
              var jan_result = "win";
            } else if (jinbe === "cho") {
              var jan_result = "aiko";
            } else if (jinbe === "gu") {
              var jan_result = "lose";
            }
          } else if (interaction.customId === "gu") {
            // 自分がグーの時
            if (jinbe === "pa") {
              var jan_result = "lose";
            } else if (jinbe === "cho") {
              var jan_result = "win";
            } else if (jinbe === "gu") {
              var jan_result = "aiko";
            }
          }
          // 変数調整
          //me変数の日本語化
          if (me === "pa") {
            var result_me = "パー";
          } else if (me === "cho") {
            var result_me = "チョキ";
          } else if (me === "gu") {
            var result_me = "グー";
          }
          //jinbe変数の日本語化
          if (jinbe === "pa") {
            var result_jinbe = "パー";
          } else if (jinbe === "cho") {
            var result_jinbe = "チョキ";
          } else if (jinbe === "gu") {
            var result_jinbe = "グー";
          }
          //結果の日本語化
          if (jan_result === "win") {
            var result_ja = "あなたの勝ち";
          } else if (jan_result === "aiko") {
            var result_ja = "あいこ";
          } else if (jan_result === "lose") {
            var result_ja = "あなたの負け";
          }
          // 色調整
          if (jan_result === "win") {
            var color = 0xff0000;
          } else if (jan_result === "aiko") {
            var color = 0xffff00;
          } else if (jan_result === "lose") {
            var color = 0x0000ff;
          }
          // file_pass設定
          if (jan_result === "win") {
            var file_pas = "images/win.png";
          } else if (jan_result === "aiko") {
            var file_pas = "images/aiko.png";
          } else if (jan_result === "lose") {
            var file_pas = "images/lose.png";
          }
          // 結果表示
          await interaction.channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [
              {
                title: "じゃんけんの結果！",
                description: `あなたは ${result_me}を出して、\n私は　${result_jinbe}を出したので、\n\n__**${result_ja}です！**__`,
                color: color,
                thumbnail: {
                  url: "attachment://omi_kekka.png",
                },
              },
            ],
            files: [{ attachment: file_pas, name: "omi_kekka.png" }],
          });
        }

        if (interaction.customId === "cancel") {
          interaction.message.delete();
        }
      }
    }
  } catch (err) {
    const errorNotification = require("../functions.js");
    errorNotification(client, interaction, err);
  }
};
