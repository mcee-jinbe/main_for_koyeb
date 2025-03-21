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
      let user = interaction.options.getUser("user");
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        ) ||
        user == null
      ) {
        user = interaction.user;
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
      });
      //誕生日を祝う機能が使えるか確認
      serverDB
        .findOne({ _id: interaction.guild.id })
        .catch((err) => {
          Sentry.setTag("Error Point", "birthdayUnregisterGetServerDB");
          Sentry.captureException(err);
          return interaction.editReply({
            content:
              "内部エラーが発生しました。\nサーバー用データベースが正常に作成されなかった可能性があります。",
            flags: MessageFlags.Ephemeral,
          });
        })
        .then(async (model) => {
          if (!model) {
            return interaction.editReply({
              content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
              flags: MessageFlags.Ephemeral,
            });
          }

          if (model.status == "false") {
            return interaction.editReply({
              content:
                "申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。",
              flags: MessageFlags.Ephemeral,
            });
          } else if (model.status == "true") {
            await userDB
              .findById(user.id)
              .then(async (result) => {
                if (!result)
                  return interaction.editReply({
                    content:
                      "そのユーザーのデータは存在しません。既に削除された可能性があります。",
                  });

                // ユーザーDBに居る場合は、削除手続きを行う。
                await userDB
                  .updateOne(
                    { _id: user.id },
                    { $pull: { serverIDs: interaction.guild.id } }
                  )
                  .then((updatedResult) => {
                    return interaction.editReply({
                      content: `このサーバーにおける、<@${user.id}>さんのデータの削除が完了しました。`,
                    });
                  });

                // serverIDsが何もなければデータ削除
                await userDB
                  .findById(user.id)
                  .then(async (updatedResult) => {
                    if (updatedResult.serverIDs.length == 0) {
                      await userDB.deleteOne({ _id: user.id });
                    }
                  })
                  .catch((err) => {
                    Sentry.setTag("Error Point", "birthdayUnregisterGetUpdatedUserDB");
                    Sentry.captureException(err);
                    return interaction.editReply({
                      content:
                        "内部エラーが発生しました。\nユーザー用データベースのステータスの値が予期しない値であった可能性があります。",
                    });
                  });
              })
              .catch((err) => {
                Sentry.setTag("Error Point", "birthdayUnregisterGetUserDB");
                Sentry.captureException(err);
                return interaction.editReply({
                  content:
                    "内部エラーが発生しました。\nサーバー用データベースのステータスの値が予期しない値であった可能性があります。",
                });
              });
          }
        });
    } catch (err) {
      Sentry.setTag("Error Point", "birthday_register");
      Sentry.captureException(err);
    }
  },
};
