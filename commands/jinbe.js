const { ApplicationCommandOptionType } = require("discord.js");
const omikujiSystem = require("./omikuji.js");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "jinbe",
  description: "🥠おみくじを引こう！！",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "secret",
      description: "結果を非公開で送信したい場合は設定してください。",
      required: false,
      choices: [{ name: "非公開にする", value: "true" }],
    },
  ],

  run: async (client, interaction) => {
    try {
      ///jinbeコマンドは、/omikujiコマンドのエイリアスとして使用する。
      omikujiSystem.run(client, interaction);
    } catch (err) {
      Sentry.setTag("Error Point", "jinbe_omikuji");
      Sentry.captureException(err);
    }
  },
};
