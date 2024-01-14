const { ApplicationCommandOptionType } = require("discord.js");
const userDB = require("../models/user_db.js");
const serverDB = require("../models/server_db.js");

module.exports = {
  name: "birthday_register",
  description: "🔧誕生日を登録・更新しよう！",
  options: [
    {
      type: ApplicationCommandOptionType.Number,
      name: "month",
      description: "誕生月を入力してください（半角数字で「1」~「12」を入力）",
      value: "month",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Number,
      name: "day",
      description: "誕生日を入力してください(半角数字で「1」~「31」を入力)",
      value: "day",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      //誕生日を祝う機能が使えるか確認
      serverDB
        .findOne({ _id: interaction.guild.id })
        .catch((err) => {
          console.log(err);
          return interaction.reply({
            content:
              "内部エラーが発生しました。\nサーバー用データベースが正常に作成されなかった可能性があります。",
            ephemeral: true,
          });
        })
        .then(async (model) => {
          if (!model) {
            return interaction.reply({
              content:
                "申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/api/oauth2/authorize?client_id=946587263691788399&permissions=274878000128&scope=bot%20applications.commands)から再招待をお願い致します。",
              ephemeral: true,
            });
          }

          if (model.status == "false") {
            return interaction.reply({
              content:
                "申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。",
              ephemeral: true,
            });
          } else if (model.status == "true") {
            // スラッシュコマンドの入力情報を取得
            var new_birthday_month = interaction.options.getNumber("month");
            var new_birthday_day = interaction.options.getNumber("day");
            let lastDay = new Date(2020, new_birthday_month, 0).getDate();

            let user_id = interaction.user.id;

            if (new_birthday_month >= 1 && new_birthday_month <= 12) {
              if (new_birthday_day >= 1 && new_birthday_day <= lastDay) {
                if (new_birthday_month >= 1 && new_birthday_month <= 9) {
                  var new_birthday_month = "0" + new_birthday_month;
                }
                if (new_birthday_day >= 1 && new_birthday_day <= 9) {
                  var new_birthday_day = "0" + new_birthday_day;
                }
                let database_data = await userDB.find({
                  uid: user_id,
                  serverID: interaction.guild.id,
                });
                if (!database_data.length) {
                  const profile = await userDB.create({
                    uid: user_id,
                    serverID: interaction.guild.id,
                    user_name: interaction.user.name,
                    birthday_month: new_birthday_month,
                    birthday_day: new_birthday_day,
                    status: "yet",
                  });
                  profile
                    .save()
                    .catch(async (err) => {
                      console.log(err);
                      await interaction.reply(
                        "申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。"
                      );
                      return;
                    })
                    .then(async () => {
                      await interaction.reply({
                        embeds: [
                          {
                            title: "新規登録完了！",
                            description: `あなたの誕生日を\`${new_birthday_month}月${new_birthday_day}日\`に設定しました。`,
                            color: 0x0000ff,
                          },
                        ],
                      });
                      return;
                    });
                } else {
                  userDB
                    .findOne({ uid: user_id, serverID: interaction.guild.id })
                    .catch((err) => {
                      console.log(err);
                      return interaction.reply({
                        content:
                          "誕生日のデータを更新する際に、内部エラーが発生しました。\nサポートサーバーからエラーが発生した旨を伝えてください。",
                        ephemeral: true,
                      });
                    })
                    .then((model) => {
                      // 古い情報を取得
                      let old_month = model.birthday_month;
                      let old_day = model.birthday_day;
                      // 内容を更新
                      model.birthday_month = new_birthday_month;
                      model.birthday_day = new_birthday_day;
                      model.status = "yet";
                      model.save().then(async () => {
                        await interaction.reply({
                          embeds: [
                            {
                              title: "更新完了！",
                              description: `あなたの誕生日を\`${old_month}月${old_day}日\`から\`${new_birthday_month}月${new_birthday_day}日\`に更新しました。`,
                              color: 0x10ff00,
                            },
                          ],
                        });
                        return;
                      });
                    });
                }
              } else {
                await interaction.reply({
                  embeds: [
                    {
                      title: "エラー！",
                      description: `${new_birthday_month}月には、最大で${lastDay}日までしか存在しません。\n正しい月日使用して再度お試しください。`,
                      color: 0xff0000,
                    },
                  ],
                  ephemeral: true,
                });
              }
            } else {
              await interaction.reply({
                embeds: [
                  {
                    title: "エラー！",
                    description: `1年は1～12月までしか存在しません。\n正しい月日を使用して再度お試しください。`,
                    color: 0xff0000,
                  },
                ],
                ephemeral: true,
              });
            }
          } else {
            return interaction.reply({
              content:
                "内部エラーが発生しました。\nサーバー用データベースのステータスの値が予期しない値であった可能性があります。",
              ephemeral: true,
            });
          }
        });
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
