const { client } = require("../index.js");

module.exports = {
  data: {
    name: "member_list_create",
    description: "🧰データベースを作成します！(Hoshimikan6490限定)",
  },
  async execute(interaction) {
    if (interaction.user.id === "728495196303523900") {
      if (interaction.guild.id === "768073209169444884") {
        await interaction.deferReply();
        // サーバー内の全メンバーを取得する
        const members = await interaction.guild.members.fetch();
        // mapを使って全メンバーのユーザータグの配列を作る
        const tags = members.map((member) => member.user.id);

        const profileModel = require("../models/profileSchema.js");
        for (var key in tags) {
          const user_id = tags[key];
          //先ほど作成したスキーマを参照
          const isBot = (await client.users.fetch(user_id)).bot;
          if (isBot) {
            // 無視
          } else {
            const profileData = await profileModel.findOne({
              _id: user_id,
            });
            if (!profileData) {
              const user_name = (await interaction.client.users.fetch(user_id))
                .username;
              const profile = await profileModel.create({
                _id: tags[key], //ユーザーID
                user_name: user_name, //ユーザーネーム
                birthday_month: "no_data",
                birthday_day: "no_data",
                status: "yet",
              });
              profile.save();
              console.log(user_name + "さんのデータを作成しました");
              //一応ログとしてコンソールに出力
            }
          }
        }
        await interaction.editReply("✅データベースの作成が完了しました！");
      } else {
        await interaction.reply({
          content:
            "専用サーバーで実行してください。\nこのサーバーでは使用できません。",
          ephemeral: true,
        });
      }
    } else {
      await interaction.reply({
        content:
          "申し訳ございません。\nこのコマンドは<@728495196303523900>のみ有効です。",
        ephemeral: true,
      });
    }
  },
};
