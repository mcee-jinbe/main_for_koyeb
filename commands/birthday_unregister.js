const {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionsBitField,
} = require("discord.js");
const userDB = require("../models/user_db.js");
const serverDB = require("../models/server_db.js");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "birthday_unregister",
  description: "🔧このサーバーに登録した誕生日情報を削除します",
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: "user",
      description:
        "誕生日データを削除するユーザーを指定します(サーバー管理者限定)",
      required: false,
    },
  ],

  run: async (client, interaction) => {
    try {
      // ユーザー指定があればそれを使用する。管理者以外が実行した場合は強制的に実行者のデータを扱うようにする
      let targetUser = interaction.options.getUser("user");
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        ) ||
        targetUser == null
      ) {
        targetUser = interaction.user;
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
      });
      //誕生日を祝う機能が使えるか確認
      let server = await serverDB.findById(interaction.guild.id);
      if (!server) {
        return interaction.editReply({
          content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!server.status) {
        return interaction.editReply({
          content:
            "申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        let user = await userDB.findById(targetUser.id);
        if (!user)
          return interaction.editReply({
            content:
              "そのユーザーのデータは存在しません。登録されていないか、既に削除された可能性があります。",
          });

        // TODO: ボタンで確認をしてから削除するように変更
        // ユーザーDBに居る場合は、削除手続きを行う。
        user.serverIDs = user.serverIDs.filter((serverID) => {
          return serverID != interaction.guild.id;
        });
        user
          .save()
          .then(() => {
            return interaction.editReply({
              content: `このサーバーにおける、<@${user.id}>さんのデータの削除が完了しました。`,
            });
          })
          .catch((err) => {
            Sentry.setTag("Error Point", "birthdayUnregisterSaveDB");
            Sentry.captureException(err);
          });

        // serverIDsが何もなければデータ削除
        if (user.serverIDs.length == 0) {
          await userDB.deleteOne({ _id: user.id });
        }
      }
    } catch (err) {
      Sentry.setTag("Error Point", "birthday_unregister");
      Sentry.captureException(err);
    }
  },
};
