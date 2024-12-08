const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "ping",
  description: "BotのPingを測定します。",
  run: async (client, interaction) => {
    try {
      let sent = await interaction.reply({
        content: "🔄️　計測中…",
        fetchReply: true,
      });

      interaction.editReply(
        `# Ping計測結果
        - WebsocketのPing: \`${Math.abs(client.ws.ping)}ms\`.
        - APIのLatency: \`${
          sent.createdTimestamp - interaction.createdTimestamp
        }ms\`.`
      );
    } catch (err) {
      Sentry.setTag("Error Point", "ping");
      Sentry.captureException(err);
    }
  },
};
