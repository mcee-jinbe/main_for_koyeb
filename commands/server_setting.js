const {
  ApplicationCommandOptionType,
  PermissionsBitField,
  PermissionFlagsBits,
} = require("discord.js");
const serverDB = require("../models/server_db.js");

module.exports = {
  data: {
    name: "server_setting",
    description: "🛠️サーバーの設定を変更します。",
    options: [
      {
        name: "birthday_celebrate",
        description:
          "誕生日を祝う機能を有効にするか設定をします。(無効にした場合は、チャンネルの設定は無視されます。)",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "true_or_false",
            description: "有効(true)か無効(false)か選択してください。",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "有効(true)", value: "true" },
              { name: "無効(false)", value: "false" },
            ],
          },
          {
            name: "channel",
            description:
              "誕生日を祝うチャンネルを指定してください。(有効の場合のみ使用されます)",
            type: ApplicationCommandOptionType.Channel,
            require: false,
          },
        ],
      },
      {
        name: "show",
        description: "設定を閲覧します。",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  async execute(interaction) {
    if (interaction.options.getSubcommand() == "birthday_celebrate") {
      console.log("server_setting celebrate start");
      await interaction.deferReply({ ephemeral: true });
      if (
        !interaction.memberPermissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        console.log("serv_set permission tarinai");
        return interaction.editReply({
          content:
            "あなたは管理者権限を持っていないため、サーバー設定を変更できません。\n変更したい場合は、サーバー管理者にこのコマンドを実行するようにお願いしてください。",
          ephemeral: true,
        });
      } else {
        console.log("serv_set start");
        let status = interaction.options.getString("true_or_false");
        let channel = interaction.options.getChannel("channel");

        let data = serverDB.find({ _id: interaction.guild.id });
        if (!data) {
          console.log("channel id set");
          if (status == "true") {
            if (channel) {
              var st = channel.id;
            } else {
              return interaction.editReply({
                content: "⚠️誕生日を祝うチャンネルを指定してください。",
                ephemeral: true,
              });
            }
          } else {
            var st = null;
          }

          console.log("serverdb create");
          const profile = await serverDB.create({
            _id: interaction.guild.id,
            channelID: st,
            status: status,
          });
          profile
            .save()
            .catch((err) => {
              console.log(err);
              return interaction.editReply(
                "申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。"
              );
            })
            .then(() => {
              console.log("serverdb saved");
              return interaction.editReply({
                embeds: [
                  {
                    title: "設定を保存しました！",
                    color: 0x0000ff,
                  },
                ],
              });
            });
        } else {
          console.log("serverdb updatastart");
          if (status == "true") {
            console.log("channel id set");
            if (channel) {
              var st = channel.id;
            } else {
              return interaction.editReply({
                content: "⚠️誕生日を祝うチャンネルを指定してください。",
                ephemeral: true,
              });
            }
          } else {
            var st = null;
          }

          console.log("serverdb update");
          serverDB
            .findById(interaction.guild.id)
            .catch(async (err) => {
              console.log(err);
              console.log("serverdb update error");
              await interaction.editReply({
                content:
                  "内部エラーが発生しました。\nこの旨をサポートサーバーでお伝えください。",
                ephemeral: true,
              });
            })
            .then((model) => {
              model.channelID = st;
              model.status = status;
              model.save().then(async () => {
                console.log("serverdb update finished");
                await interaction.editReply({
                  embeds: [
                    {
                      title: "設定を更新しました！",
                      color: 0x10ff00,
                    },
                  ],
                });
                return;
              });
            });
        }
      }
    } else if (interaction.options.getSubcommand() == "show") {
      console.log("server_setting show start");
      serverDB
        .findById(interaction.guild.id)
        .catch((err) => {
          console.log(err);
        })
        .then((model) => {
          if (model.status == "true") {
            console.log("show start");
            var status = "有効(true)";
            var channel = interaction.guild.channels.cache.find(
              (ch) => ch.id === model.channelID
            );
            if (!channel) {
              var channel = "`見つかりませんでした！`";
            }
          } else if (model.status == "false") {
            var status = "無効(false)";
            var channel = "`(機能が無効のため、この項目は無効化されています)`";
          }

          console.log("server setting show send");
          return interaction.reply({
            embeds: [
              {
                title: `${interaction.guild.name}の設定`,
                description: `- 誕生日を祝う機能：　${status}\n- 誕生日を祝うチャンネル:　${channel}`,
              },
            ],
          });
        });
    }
  },
};
