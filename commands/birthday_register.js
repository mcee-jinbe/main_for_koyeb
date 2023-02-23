const {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const profileModel = require('../models/profileSchema.js');

module.exports = {
  data: {
    name: 'birthday_register',
    description: '🔧誕生日を登録・更新しよう！',
    options: [
      {
        type: ApplicationCommandOptionType.Number,
        name: 'month',
        description: '誕生月を入力してください（半角数字で「1」~「12」を入力）',
        value: 'month',
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Number,
        name: 'day',
        description: '誕生日を入力してください(半角数字で「1」~「31」を入力)',
        value: 'day',
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (interaction.guild.id == "768073209169444884") {
      // スラッシュコマンドの入力情報を取得
      const new_birthday_month = interaction.options.getNumber('month');
      const new_birthday_day = interaction.options.getNumber('day');
      let lastday = new Date(2020, new_birthday_month, 0).getDate();

      let user_id = interaction.user.id;

      if (new_birthday_month >= 1 && new_birthday_month <= 12) {
        if (new_birthday_day >= 1 && new_birthday_day <= lastday) {
          let database_data = await profileModel.findById(user_id);
          let database_month = database_data.birthday_month;
          let database_day = database_data.birthday_day;
          console.log(
            `---データベースからのデータ---\nmonth: ${database_month}\nday: ${database_day}\n------`
          );

          if (database_month == 'no_data') {
            if (database_day == 'no_data') {
              profileModel.findOne({ _id: user_id }, function(err, model) {
                if (err) {
                  console.log(err.message);
                  return;
                }

                // 内容を更新
                model.birthday_month = new_birthday_month;
                model.birthday_day = new_birthday_day;
                model.save(async function(err, model) {
                  if (err) {
                    console.log(err.message);
                    await interaction.reply(
                      '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。'
                    );
                    return;
                  } else {
                    await interaction.reply({
                      embeds: [
                        {
                          title: '新規登録完了！',
                          description:
                            `あなたの誕生日を\`${new_birthday_month}月${new_birthday_day}日\`に設定しました。`,
                          color: 0x0000ff
                        },
                      ],
                    });
                    return;
                  }
                });
              });
            } else {
              await interaction.reply(
                '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースのmonthだけがno_dataでした。'
              );
            }
          } else {
            if (database_day == 'no_data') {
              await interaction.reply(
                '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースのdayだけがno_dataでした。'
              );
            } else {
              profileModel.findOne({ _id: user_id }, function(err, model) {
                if (err) {
                  console.log(err.message);
                  return;
                }

                // 古い情報を取得
                let old_month = model.birthday_month;
                let old_day = model.birthday_day;
                // 内容を更新
                model.birthday_month = new_birthday_month;
                model.birthday_day = new_birthday_day;
                model.status = 'yet'
                model.save(async function(err, model) {
                  if (err) {
                    console.log(err.message);
                    await interaction.reply(
                      '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。'
                    );
                    return;
                  } else {
                    await interaction.reply({
                      embeds: [
                        {
                          title: '更新完了！',
                          description:
                            `あなたの誕生日を\`${old_month}月${old_day}日\`から\`${new_birthday_month}月${new_birthday_day}日\`に更新しました。`,
                          color: 0x10ff00
                        },
                      ],
                    });
                    return;
                  }
                });
              });
            }
          }
        } else {
          await interaction.reply({
            embeds: [
              {
                title: 'エラー！',
                description: `${new_birthday_month}月には、最大で${lastday}日までしか存在しません。\n正しい月日使用して再度お試しください。`,
                color: 0xFF0000
              }
            ],
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          embeds: [
            {
              title: 'エラー！',
              description: `1年は1～12月までしか存在しません。\n正しい月日を使用して再度お試しください。`,
              color: 0xFF0000
            }
          ],
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        embeds: [
          {
            title: 'エラー！',
            description: `このサーバーでこのコマンドは実行できません。`,
            color: 0xFF0000
          }
        ],
        ephemeral: true
      });
    }
  },
};
