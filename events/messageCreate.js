const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();
const cooldown = new Map();
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

const url_check_api = process.env.url_check_api;

//URLチェックの動作を指定
async function getSafe(urls, message) {
  let request_url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${url_check_api}`;

  let data = {
    client: {
      clientId: "jinbe",
      clientVersion: "1.5.2",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
      platformTypes: ["WINDOWS"],
      threatEntryTypes: ["URL"],
      threatEntries: urls.map((f) => {
        return { url: f };
      }),
    },
  };

  fetch(request_url, {
    method: "POST", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.matches) {
        message.reply({
          embeds: [
            {
              title: "⚠⚠⚠危険なURLを検知しました！⚠⚠⚠",
              description: `<@${message.author.id}> が投稿した内容には、__危険なURLが含まれる可能性が高いです__\n\n__**絶対に、アクセスしないでください!**__`,
              color: 0xff0000,
              footer: {
                text: "アクセスする際は、自己責任でお願いいたします。",
              },
            },
          ],
        });
      } else {
        return;
      }
    });
}

// 特定のキーと値に一致するエントリを抽出する関数
function filterMapByKeyValue(map, key, value) {
  const result = new Map();
  for (const [mapKey, mapValue] of map.entries()) {
    if (mapValue[key].startsWith(value)) {
      result.set(mapKey, mapValue);
    }
  }
  return result;
}

module.exports = async (client, message) => {
  try {
    if (message.author.bot) return;

    let myPermissions = message.guild.members.me
      .permissionsIn(message.channel)
      .toArray();
    let conditions = [
      "ViewChannel",
      "SendMessages",
      "ManageMessages",
      "EmbedLinks",
      "AttachFiles",
    ];
    for (const key in conditions) {
      if (!myPermissions.includes(conditions[key])) {
        return;
      }
    }

    //危険なURLに警告
    let urls = String(message.content).match(
      /https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#\u3000-\u30FE\u4E00-\u9FA0\uFF01-\uFFE3]+/g
    );
    if (urls) {
      getSafe(urls, message);
    }

    //メッセージ展開
    let GuildIds = JSON.parse(process.env.allowedServers);
    if (GuildIds.includes(message.guild.id)) {
      const MESSAGE_URL_REGEX =
        /https?:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
      const matches = MESSAGE_URL_REGEX.exec(message.content);
      if (matches) {
        const [url, guildId, channelId, messageId] = matches;
        try {
          const channel = await client.channels.fetch(channelId);
          const fetchedMessage = await channel.messages.fetch(messageId);

          // button生成
          let guideButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("メッセージを見る")
              .setURL(fetchedMessage.url)
              .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
              .setCustomId("cancel")
              .setEmoji("🗑️")
              .setStyle(ButtonStyle.Secondary)
          );
          let notificationButton = new ActionRowBuilder();

          let embed = new EmbedBuilder()
            .setURL(fetchedMessage.url)
            .setDescription(
              fetchedMessage.content ? fetchedMessage.content : "\u200B" //contentに何もなければゼロ幅スペースを入力
            )
            .setAuthor({
              name: fetchedMessage.author.tag,
              iconURL: fetchedMessage.author.displayAvatarURL(),
            })
            .setColor(0x4d4df7)
            .setTimestamp(new Date(fetchedMessage.createdTimestamp));

          // 添付ファイル関連処理
          let imageEmbed = [];
          if (fetchedMessage.attachments.size > 0) {
            // 画像添付ファイル処理
            let attachedImages = filterMapByKeyValue(
              fetchedMessage.attachments,
              "contentType",
              "image/"
            );
            if (attachedImages.size >= 2) {
              attachedImages.forEach((attachedImage) => {
                let attachmentField = {
                  url: fetchedMessage.url,
                  image: {
                    url: attachedImage.url,
                  },
                };
                imageEmbed.push(attachmentField);
              });
            }
            if (attachedImages.size > 4) {
              notificationButton.addComponents(
                new ButtonBuilder()
                  .setCustomId("dummy0")
                  .setEmoji("⚠️")
                  .setLabel("元メッセージに5枚以上の画像あり")
                  .setDisabled(true)
                  .setStyle(ButtonStyle.Secondary)
              );
            }

            // 画像以外の添付ファイル処理
            if (fetchedMessage.attachments.size != attachedImages.size) {
              notificationButton.addComponents(
                new ButtonBuilder()
                  .setCustomId("dummy1")
                  .setEmoji("⚠️")
                  .setLabel("元メッセージに画像以外の添付ファイルあり")
                  .setDisabled(true)
                  .setStyle(ButtonStyle.Secondary)
              );
            }
          }

          // 埋め込みがある場合
          if (fetchedMessage.embeds.length) {
            notificationButton.addComponents(
              new ButtonBuilder()
                .setCustomId("dummy2")
                .setEmoji("⚠️")
                .setLabel("元メッセージに埋め込みあり")
                .setDisabled(true)
                .setStyle(ButtonStyle.Secondary)
            );
          }

          message.channel.send({
            embeds: [embed].concat(imageEmbed),
            components: notificationButton.components.length
              ? [guideButton, notificationButton]
              : [guideButton],
          });

          //メッセージリンクだけが投稿された場合の処理
          if (url == message.content) {
            message.delete();
          }
        } catch (err) {
          Sentry.setTag("Error Point", "messageExpansion");
          Sentry.captureException(err);
          return;
        }
      }
    }

    // プレフィクスが要らない系コマンド
    if (
      message.content.match(/jinbeおはよう/) ||
      message.content.match(/おはようjinbe/)
    ) {
      message.channel.send("おはよう！");
    } else if (
      message.content.match(/jinbeこんにちは/) ||
      message.content.match(/こんにちはjinbe/)
    ) {
      message.channel.send("こんにちわああああ！");
    } else if (
      message.content.match(/jinbeこんばんは/) ||
      message.content.match(/こんばんはjinbe/)
    ) {
      message.channel.send("こんばんわ！！");
    } else if (
      message.content.match(/jinbeおやすみ/) ||
      message.content.match(/おやすみjinbe/)
    ) {
      message.channel.send("おやすみ～\nいい夢見てね…");
    } else if (
      /^omikuji$|^jinbe$|^omikujinbe$|^janken$/.test(message.content)
    ) {
      // ここのコードは、チャット入力コマンドがスラッシュコマンドに仕様変更になったことによる案内文を表示するコード
      const guildId = message.guild.id;
      const now = Date.now();
      const cooldownAmount = 24 * 60 * 60 * 1000; // 1週間

      if (!cooldown.has(guildId) || now > cooldown.get(guildId)) {
        let deleteButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("このメッセージを削除する")
            .setEmoji("🗑️")
            .setCustomId("delete")
            .setStyle(ButtonStyle.Secondary)
        );
        message.reply({
          content:
            "申し訳ございません。「omikuji」、「jinbe」、「omikujinbe」、「janken」を利用したおみくじやじゃんけんは、スラッシュコマンドに移行しました。\n`/omikuji`や`/janken`、`/jinbe`コマンドをご利用ください。",
          components: [deleteButton],
          flags: MessageFlags.Ephemeral,
        });

        cooldown.set(guildId, now + cooldownAmount);
        setTimeout(() => cooldown.delete(guildId), cooldownAmount);
      }
    }
  } catch (err) {
    Sentry.setTag("Error Point", "messageCreate");
    Sentry.captureException(err);
  }
};
