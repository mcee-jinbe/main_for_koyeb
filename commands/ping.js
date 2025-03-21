const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "ping",
  description: "BotのPingを測定します。",
  run: async (client, interaction) => {
    try {
      await interaction.reply(
        `WebSocketのPing: ${interaction.client.ws.ping}ms\nAPIのエンドポイントのPing: ...`
      );

      let msg = await interaction.fetchReply();

      return interaction.editReply(
        `WebSocketのPing: ${
          interaction.client.ws.ping
        }ms\nAPIのエンドポイントのPing: ${
          msg.createdTimestamp - interaction.createdTimestamp
        }ms`
      );
    } catch (err) {
      Sentry.setTag("Error Point", "ping");
      Sentry.captureException(err);
    }
  },
};
