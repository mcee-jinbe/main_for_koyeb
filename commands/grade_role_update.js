const { PermissionsBitField } = require("discord.js");
const { setTimeout } = require("node:timers/promises");

module.exports = {
  data: {
    name: "grade_role_update",
    description: "⬆学年ロールを更新します(サーバー管理者限定)",
  },
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      interaction.reply({
        content: "申し訳ございません。\nこのコマンドは管理者限定です",
        ephemeral: true,
      });
    } else {
      await interaction.deferReply();
      let grade_role_names = [
        "高校3年生",
        "高校2年生",
        "高校1年生",
        "中学3年生",
        "中学2年生",
        "中学1年生",
      ];

      // サーバー内の全メンバーを取得する
      const members = await interaction.guild.members.fetch();
      // mapを使って全メンバーのユーザータグの配列を作る
      const tags = members.map((member) => member.user.id);

      for (var key in tags) {
        const user_id = tags[key];
        const user = interaction.guild.members.cache.get(user_id);

        // 高３だけ別処理
        const grade_role_kou3 = await interaction.guild.roles.cache.find(
          (role) => role.name === "高校3年生"
        );
        const grade_role_sotugyo = await interaction.guild.roles.cache.find(
          (role) => role.name === "■≫卒業生"
        );
        const grade_role_seito = await interaction.guild.roles.cache.find(
          (role) => role.name === "■≫生徒"
        );
        if (user.roles.cache.has(grade_role_kou3.id)) {
          user.roles.remove(grade_role_kou3);
          user.roles.add(grade_role_sotugyo);
          user.roles.remove(grade_role_seito);
        } else {
          ///////////////////////////////////////////////////////////////////
          // それ以外のロール処理
          for (var key2 in grade_role_names) {
            if (Number(key2) !== 0) {
              const grade_role_name = grade_role_names[key2];
              const grade_role_new_name = grade_role_names[Number(key2) - 1];

              const grade_role = await interaction.guild.roles.cache.find(
                (role) => role.name === grade_role_name
              );
              const grade_role_id = grade_role.id;
              const grade_role_new = await interaction.guild.roles.cache.find(
                (role) => role.name === grade_role_new_name
              );

              if (user.roles.cache.has(grade_role_id)) {
                user.roles.remove(grade_role);
                user.roles.add(grade_role_new);
              }
            }

            await setTimeout(500);
          }
        }
        await setTimeout(500);
      }
      await interaction.editReply("✅更新が完了しました。");
    }
  },
};
