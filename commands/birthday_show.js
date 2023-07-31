const { ApplicationCommandOptionType } = require("discord.js");
const { client } = require("../index.js");

module.exports = {
  data: {
    name: "birthday_show",
    description: "🖥データベースに登録された情報を表示します",
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "type",
        description: "何の情報を表示しますか",
        required: true,
        choices: [
          { name: "全体", value: "all" },
          { name: "個人", value: "user" },
        ],
      },
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        value: "user",
        description:
          "誰の情報を表示しますか？（「全体の情報を表示」を選んだ場合は、無効化されます）",
        required: false,
      },
    ],
  },
  async execute(interaction) {
    if (interaction.guild.id == "768073209169444884") {
      await interaction.deferReply({
        ephemeral: true,
      });
      const profileModel = require("../models/profileSchema.js");
      let show_type = interaction.options.getString("type");
      let show_user = interaction.options.getUser("user");

      if (show_type == "all") {
        let database_members = await profileModel.find({});
        let member_list = database_members.map(
          (database_members) => database_members.user_name
        );
        await interaction.editReply({
          embeds: [
            {
              title: "現在、データベースに登録されているユーザー一覧",
              description: `※誕生日が登録されていないユーザーも含みます。\n\`\`\`\n${member_list.join(
                "\n"
              )}\n\`\`\``,
              color: 0xaad0ff,
              timestamp: new Date(),
            },
          ],
          ephemeral: false,
        });
      } else if (show_type == "user") {
        if (show_user !== null) {
          const isBot = (await client.users.fetch(show_user)).bot;
          if (!isBot) {
            let database_data = await profileModel.findById(show_user.id);
            let database_month = database_data.birthday_month;
            let database_day = database_data.birthday_day;

            if (database_month == "no_data" || database_day == "no_data") {
              await interaction.editReply({
                content: "誕生日が登録されていません。",
                ephemeral: false,
              });
            } else {
              await interaction.editReply({
                content: "",
                embeds: [
                  {
                    title: `${show_user.username}さんの情報`,
                    description: `ユーザー名：　\`${show_user.username}\`\nユーザーID：　\`${show_user.id}\`\n誕生日(登録されたもの)：　\`${database_month}月${database_day}日\``,
                  },
                ],
                ephemeral: false,
              });
            }
          } else {
            await interaction.editReply({
              content: "",
              embeds: [
                {
                  title: "エラー！",
                  description:
                    "指定された対象は「<:bot:1050345033305436170>」です。\n残念ながら、彼らに誕生日という概念を教えることが出来ません。対象には人を選んでください。",
                  color: 0xff0000,
                },
              ],
            });
          }
        } else {
          await interaction.editReply({
            content: "",
            embeds: [
              {
                title: "エラー！",
                description:
                  "誕生日の情報を表示する対象を指定してください。\n　例)　`/birthday_show [個人]　[@Hoshimikan6490]`",
                color: 0xff0000,
              },
            ],
          });
        }
      }
    } else {
      await interaction.reply({
        embeds: [
          {
            title: "エラー！",
            description: `このサーバーでこのコマンドは実行できません。`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }
  },
};
