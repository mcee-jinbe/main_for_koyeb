const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
  MessageFlags,
} = require("discord.js");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "janken",
  description: "✊✌️🖐️じゃんけんをしよう！！",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "secret",
      description: "結果を非公開で送信したい場合は設定してください。",
      required: false,
      choices: [{ name: "非公開にする", value: "true" }],
    },
  ],

  run: async (client, interaction) => {
    try {
      const secret = interaction.options.getString("secret");
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
          flags: MessageFlags.Ephemeral,
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
              // 処理用の変数を用意
              let me,
                jan_result,
                result_me,
                result_jinbe,
                result_ja,
                color,
                file_pas;
              // 自分の手を「me」に代入
              if (buttonId.includes("pa")) {
                me = "pa";
              } else if (buttonId.includes("cho")) {
                me = "cho";
              } else if (buttonId.includes("gu")) {
                me = "gu";
              }
              // 結果判定
              // 自分がパーの時
              if (buttonId.includes("pa")) {
                if (jinbe === "pa") {
                  jan_result = "aiko";
                } else if (jinbe === "cho") {
                  jan_result = "lose";
                } else if (jinbe === "gu") {
                  jan_result = "win";
                }
                // 自分がチョキの時
              } else if (buttonId.includes("cho")) {
                if (jinbe === "pa") {
                  jan_result = "win";
                } else if (jinbe === "cho") {
                  jan_result = "aiko";
                } else if (jinbe === "gu") {
                  jan_result = "lose";
                }
              } else if (buttonId.includes("gu")) {
                // 自分がグーの時
                if (jinbe === "pa") {
                  jan_result = "lose";
                } else if (jinbe === "cho") {
                  jan_result = "win";
                } else if (jinbe === "gu") {
                  jan_result = "aiko";
                }
              }
              // 変数調整
              //me変数の日本語化
              if (me === "pa") {
                result_me = "パー";
              } else if (me === "cho") {
                result_me = "チョキ";
              } else if (me === "gu") {
                result_me = "グー";
              }
              //jinbe変数の日本語化
              if (jinbe === "pa") {
                result_jinbe = "パー";
              } else if (jinbe === "cho") {
                result_jinbe = "チョキ";
              } else if (jinbe === "gu") {
                result_jinbe = "グー";
              }
              //結果の日本語化
              if (jan_result === "win") {
                result_ja = "あなたの勝ち";
              } else if (jan_result === "aiko") {
                result_ja = "あいこ";
              } else if (jan_result === "lose") {
                result_ja = "あなたの負け";
              }
              // 色調整
              if (jan_result === "win") {
                color = 0xff0000;
              } else if (jan_result === "aiko") {
                color = 0xffff00;
              } else if (jan_result === "lose") {
                color = 0x0000ff;
              }
              // file_pass設定
              if (jan_result === "win") {
                file_pas = "images/win.png";
              } else if (jan_result === "aiko") {
                file_pas = "images/aiko.png";
              } else if (jan_result === "lose") {
                file_pas = "images/lose.png";
              }

              // おみくじのUIを削除する
              setTimeout(async () => {
                await interaction.deleteReply();
              }, 500);

              // 結果表示
              return interaction.followUp({
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
                flags: secret ? MessageFlags.Ephemeral : 0,
              });
            }
          });
        })
        .catch((err) => {
          Sentry.setTag("Error Point", "janken_collection");
          const errorNotification = require("../errorFunction.js");
          errorNotification(client, interaction, err);
        });
    } catch (err) {
      Sentry.setTag("Error Point", "janken");
      Sentry.captureException(err);
    }
  },
};
