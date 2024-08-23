const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AuditLogEvent,
} = require("discord.js");
const serverDB = require("../models/server_db.js");

module.exports = async (client, guild) => {
  try {
    const profile = await serverDB.create({
      _id: guild.id,
      channelID: null,
      status: "false",
    });
    profile
      .save()
      .catch(async (err) => {
        console.log(err);
        client.channels.cache
          .get("889478088486948925")
          .send(
            "内部エラーが発生しました。\n新サーバーの登録時にエラーが発生しました。コンソールを確認してください。"
          );
        return;
      })
      .then(async () => {
        const button = new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("サポートサーバーに参加する")
            .setURL("https://discord.gg/uYYaVRuUuJ"),
          new ButtonBuilder()
            .setCustomId("noId")
            .setStyle(ButtonStyle.Secondary)
            .setLabel(`招待されたサーバー: ${guild.name}`)
            .setDisabled(true)
        );

        const fetchedLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.BotAdd,
          limit: 1,
        });
        const inviterInfo = fetchedLogs.entries.first().executor;
        let inviterId = inviterInfo.id;
        let inviter = client.users.fetch(inviterId);
        (await inviter).send({
          embeds: [
            {
              title: "お知らせ",
              description: `本BOTをご利用いただき、ありがとうございます。\n本BOTに搭載されたサーバー内のユーザーの誕生日を祝う機能は、各サーバーの管理者様が「\`/server_settings\`」コマンドを利用して有効化の設定をしない限りは動作しない仕組みとなっております。お手数おかけしますが、ご利用の際は設定をお願い致します。\n\`※ご不明な点がございましたら、以下のボタンより、サポートサーバーでお尋ねください。\``,
              color: 0xff0000,
              footer: {
                text: `(DMで失礼します。)`,
              },
            },
          ],
          components: [button],
        });
      });
  } catch (err) {
    const errorNotification = require("../errorFunction.js");
    errorNotification(client, guild, err);
  }
};
