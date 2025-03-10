const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AuditLogEvent,
  PermissionsBitField,
} = require("discord.js");
const serverDB = require("../models/server_db.js");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

const errorNotificationChannelID = process.env.errorNotificationChannelID;

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
        Sentry.captureException(err);
        client.channels.cache
          .get(errorNotificationChannelID)
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

        let DMuser;
        if (
          guild.members.me.permissions.has(
            PermissionsBitField.Flags.ViewAuditLog
          )
        ) {
          const fetchedLogs = await guild.fetchAuditLogs({
            type: AuditLogEvent.BotAdd,
            limit: 1,
          });
          const inviterInfo = fetchedLogs.entries.first().executor;
          let inviterId = inviterInfo.id;
          DMuser = await client.users.fetch(inviterId);
        } else {
          let owner_id = guild.ownerId;
          DMuser = await client.users.fetch(owner_id);
        }
        (await DMuser).send({
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
    Sentry.setTag("Error Point", "guildCreate");
    Sentry.captureException(err);
  }
};
