const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: {
    name: "member_list_remove",
    description: "⛔データベースを削除します！(Hoshimikan6490限定)",
  },
	async execute(interaction) {
    if (interaction.user.id === "728495196303523900") {
      if (interaction.guild.id === "768073209169444884") {
        const delete_database_YesNo = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('delete_database_Yes')
              .setLabel('削除')
              .setStyle(ButtonStyle.Danger)
              .setEmoji("⚠"),
            new ButtonBuilder()
              .setCustomId('delete_database_No')
              .setLabel('キャンセル')
              .setStyle(ButtonStyle.Secondary),
          );
        await interaction.reply({
          content: "↓こちら",
          ephemeral: true
        })
        await interaction.channel.send({
          embeds: [
            {
              title: '誕生日データベースの情報を全て削除します。よろしいですか？',
              description: 'この操作は復元不可能でつ❗️',
              color: 0xFF0000,
              }
          ],
          components: [
            delete_database_YesNo
          ]
        });
      } else {
        await interaction.editreply({
          content: "専用サーバーで実行してください。\nこのサーバーでは使用できません。",
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: "申し訳ございません。\nこのコマンドは<@728495196303523900>のみ有効です。",
        ephemeral: true
      })
    }
  }
}
