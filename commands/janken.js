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

      await interaction
        .reply({
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
          ephemeral: secret,
        })
        .then((buttonMessage) => {
          const filter = (i) => i.user.id == interaction.user.id;
          const collector = buttonMessage.createMessageComponentCollector({
            filter,
            time: 120000,
          });

          collector.on("collect", async (button) => {
            let buttonId = button?.customId;
            if (buttonId == "gu" || buttonId == "cho" || buttonId == "pa") {
              // じんべえの手を決める
              const arr = ["pa", "cho", "gu"];
              const random = Math.floor(Math.random() * arr.length);
              const jinbe = arr[random];
              // 自分の手を「me」に代入
              if (buttonId.includes("pa")) {
                var me = "pa";
              } else if (buttonId.includes("cho")) {
                var me = "cho";
              } else if (buttonId.includes("gu")) {
                var me = "gu";
              }
              // 結果判定
              // 自分がパーの時
              if (buttonId.includes("pa")) {
                if (jinbe === "pa") {
                  var jan_result = "aiko";
                } else if (jinbe === "cho") {
                  var jan_result = "lose";
                } else if (jinbe === "gu") {
                  var jan_result = "win";
                }
                // 自分がチョキの時
              } else if (buttonId.includes("cho")) {
                if (jinbe === "pa") {
                  var jan_result = "win";
                } else if (jinbe === "cho") {
                  var jan_result = "aiko";
                } else if (jinbe === "gu") {
                  var jan_result = "lose";
                }
              } else if (buttonId.includes("gu")) {
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
              await interaction.editReply({
                embeds: [
                  {
                    title: "じゃんけんの結果！",
                    description: `<@${interaction.user.id}>さんは ${result_me}を出して、\n私は　${result_jinbe}を出したので、\n\n__**${result_ja}です！**__`,
                    color: color,
                    thumbnail: {
                      url: "attachment://omi_kekka.png",
                    },
                  },
                ],
                files: [{ attachment: file_pas, name: "omi_kekka.png" }],
                components: [],
              });
            }
          });
        })
        .catch((err) => {
          err.id = "janken_collection";
          const errorNotification = require("../errorFunction.js");
          errorNotification(client, interaction, err);
        });
    } catch (err) {
      const errorNotification = require("../errorFunction.js");
      errorNotification(client, interaction, err);
    }
  },
};
