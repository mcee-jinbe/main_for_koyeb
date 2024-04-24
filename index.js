const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  InteractionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});
module.exports.client = client;
const express = require("express");
const app = express();
const cron = require("node-cron");
const { formatToTimeZone } = require("date-fns-timezone");
const mongoose = require("mongoose");
const userDB = require("./models/user_db.js");
const serverDB = require("./models/server_db.js");
const prefix = "mc!";
const util = require("util");
const wait = util.promisify(setTimeout);
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

//機密情報取得
const token = process.env["bot_token"];
const mong_db_info = process.env["mongodb_token"];
const url_check_api = process.env["url_check_api"];
const PORT = 8000;

//サイト立ち上げ
app.get("/", function (req, res) {
  res.sendStatus(200);
});
app.listen(PORT, () => {
  console.log(`Running on https://jinbe2-hoshimikan.koyeb.app/`);
});

//コマンドをBOTに適応させる準備
const commands = {};
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  console.log(`コマンドの読み込みが完了: ${command.data.name}`);
  commands[command.data.name] = command;
}

//サーバーDBにないユーザーDBは削除する
async function deleteUserDBWithoutServerDB(server_ID) {
  if (!server_ID) {
    //サーバーIDが提供されていないとき
    let users = await userDB.find();

    for (const key of users) {
      await serverDB
        .findById(key.serverID)
        .catch((err) => {
          console.log(err);
        })
        .then((model) => {
          if (!model) {
            userDB
              .deleteOne({ uid: key.uid, serverID: key.serverID })
              .catch((err) => {
                console.log(err);
              })
              .then(() => {
                console.log(
                  `正常にサーバーID「${key.serverID}」のデータを削除しました`
                );
              });
          }
        });
    }
  } else {
    //提供されたとき
    let users = await userDB.find({ serverID: server_ID });

    for (const key of users) {
      userDB
        .deleteOne({ _id: key._id, serverID: key.serverID })
        .catch((err) => {
          console.log(err);
        })
        .then(() => {
          console.log(
            `正常にサーバーID「${key.serverID}」のデータを削除しました`
          );
        });
    }
  }
}

// 誕生日チェック
async function birthday_check() {
  const FORMAT = "MM-DD";
  let now = new Date();
  let today = formatToTimeZone(now, FORMAT, { timeZone: "Asia/Tokyo" });
  let today_month = today.split("-")[0];
  let today_day = String(today.split("-")[1]);
  let model = await userDB.find({
    birthday_month: today_month,
    birthday_day: today_day,
    status: "yet",
  });

  if (!model.length) {
    console.log(
      `祝福されていない、今日(${today_month}月${today_day}日)誕生日の人は確認できませんでした。`
    );
    return;
  }

  for (const key in model) {
    // めでたい人の情報を取得して定義
    let celebrate_server_id = model[key].serverID;
    let birthday_people_id = model[key].uid;

    let server_info = await serverDB.findById(celebrate_server_id);

    //誕生日を祝う
    client.channels.cache.get(server_info.channelID).send({
      content: `<@${birthday_people_id}>`,
      embeds: [
        {
          title: "お誕生日おめでとうございます！",
          description: `今日は、<@${birthday_people_id}>さんのお誕生日です！`,
          color: 0xff00ff,
          thumbnail: {
            url: "attachment://happy_birthday.png",
          },
        },
      ],
      files: [
        {
          attachment: "./photos/jinbe_ome.png",
          name: "happy_birthday.png",
        },
      ],
    });

    //status更新
    model[key].status = "finished";
    model[key].save().catch(async (err) => {
      console.log(err);
      client.channels.cache
        .get(server_info.channelID)
        .send(
          "申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。"
        );
      client.channels.cache
        .get("889478088486948925")
        .send(
          `<@728495196303523900>\n誕生日statusの更新時にエラーが発生しました。コンソールを確認してください。\n\nエラー情報:　鯖ID: ${celebrate_server_id}、ユーザーID:　${birthday_people_id}`
        );
      return;
    });
  }
}

// botが準備できれば発動され、 上から順に処理される。
client.once("ready", async () => {
  //コマンドをBOTに適応させて、Ready!とコンソールに出力
  const data = [];
  for (const commandName in commands) {
    data.push(commands[commandName].data);
  }
  await client.application.commands.set(data);
  console.log("Ready!");

  //サーバーDBにないユーザーDBは削除する
  await deleteUserDBWithoutServerDB();

  setInterval(() => {
    client.user.setActivity({
      name: `所属サーバー数は、${client.guilds.cache.size}サーバー｜Ping値は、${client.ws.ping}ms｜koyeb.comで起動中です`,
    });
  }, 10000);
  birthday_check(); //起動時に実行

  cron.schedule(
    "15 8 * * *",
    () => {
      //8:15に実行
      birthday_check();
    },
    {
      timezone: "Asia/Tokyo",
    }
  );

  cron.schedule(
    "15 13 * * *",
    () => {
      //13:15に実行
      birthday_check();
    },
    {
      timezone: "Asia/Tokyo",
    }
  );

  cron.schedule(
    "45 15 * * *",
    () => {
      //15:45に実行
      birthday_check();
    },
    {
      timezone: "Asia/Tokyo",
    }
  );
  cron.schedule(
    "59 23 31 12 *",
    async () => {
      //12/31 23:59にリセット
      await userDB
        .find({ status: "finished" })
        .catch((err) => {
          console.log(err);
          client.channels.cache
            .get("889478088486948925")
            .send(
              "内部エラーが発生しました。\n年末の誕生日statusのリセット時にエラーが発生しました。コンソールを確認してください。"
            );
          return;
        })
        .then((model) => {
          //status更新
          for (const key in model) {
            model[key].status = "yet";
            model[key]
              .save()
              .catch(async (err) => {
                if (err) {
                  console.log(err);
                  client.channels.cache
                    .get("889478088486948925")
                    .send(
                      "内部エラーが発生しました。\n年末の誕生日statusのリセット時にエラーが発生しました。コンソールを確認してください。"
                    );
                  return;
                }
              })
              .then(() => console.log("done"));
          }
        });
    },
    {
      timezone: "Asia/Tokyo",
    }
  );

  client.channels.cache
    .get("889486664760721418")
    .send("koyeb.comで起動しました！");
});

//mongooseについて
mongoose.set("strictQuery", false);
mongoose
  .connect(mong_db_info)
  .then(() => {
    console.log("データベースに接続したんだゾ");
  })
  .catch((error) => {
    console.log(error); //エラー出力
  });

//このBOTがサーバーに追加された時の動作
client.on("guildCreate", async (guild) => {
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
          .setURL("https://discord.gg/uYYaVRuUuJ")
      );

      let owner_id = guild.ownerId;
      let owner = client.users.fetch(owner_id);
      (await owner).send({
        embeds: [
          {
            title: "お知らせ",
            description: `本BOTをご利用いただき、ありがとうございます。\n本BOTに搭載されたサーバー内のユーザーの誕生日を祝う機能は、各サーバーの管理者様が「\`/server_settings\`」コマンドを利用して有効化の設定をしない限りは動作しない仕組みとなっております。お手数おかけしますが、ご利用の際は設定をお願い致します。\n\`※ご不明な点がございましたら、以下のボタンより、サポートサーバーでお尋ねください。\``,
            color: 0xff0000,
            footer: {
              text: `DMで失礼します。`,
            },
          },
        ],
        components: [button],
      });
    });
});

//このBOTがサーバーから削除された時の動作
client.on("guildDelete", async (guild) => {
  const profile = await serverDB.findById(guild.id);

  if (!profile) {
    client.channels.cache
      .get("889486664760721418")
      .send(
        `データベースに登録されていないサーバーから退出しました。オーナーIDは${guild.ownerId}、サーバーIDは${guild.id}`
      );
  } else {
    serverDB
      .deleteOne({ _id: guild.id })
      .catch((err) => {
        console.log(err);
      })
      .then(() => {
        console.log("正常にサーバーから退出しました。");
      });

    //サーバーDBにないユーザーDBは削除する
    deleteUserDBWithoutServerDB();
  }
});

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
      if ("matches" in data) {
        message.channel.send({
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

// botがメッセージを受信すると発動され、 上から順に処理される。
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  let myPermissons = message.guild.members.me
    .permissionsIn(message.channel)
    .toArray();
  let joken = [
    "ViewChannel",
    "SendMessages",
    "ManageMessages",
    "EmbedLinks",
    "AttachFiles",
  ];
  for (const key in joken) {
    if (!myPermissons.includes(joken[key])) {
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
  let GuildIds = [
    "889474199704436776", //planet-bot-support鯖
    "913953017550745610", //てきとー鯖
    "768073209169444884", //デジクリマイクラ鯖
    "1102158301862559774", //デジクリゲーム鯖
  ];
  if (GuildIds.includes(message.guild.id)) {
    const MESSAGE_URL_REGEX =
      /https?:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
    const matches = MESSAGE_URL_REGEX.exec(message.content);
    if (matches) {
      const [url, guildId, channelId, messageId] = matches;
      try {
        const channel = await client.channels.fetch(channelId);
        const fetchedMessage = await channel.messages.fetch(messageId);

        let buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("メッセージを見る")
            .setURL(fetchedMessage.url)
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setCustomId("cancel")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Secondary)
        );

        message.channel.send({
          embeds: [
            {
              description: fetchedMessage.content,
              author: {
                name: fetchedMessage.author.tag,
                iconURL: fetchedMessage.author.displayAvatarURL(),
              },
              color: 0x4d4df7,
              timestamp: new Date(fetchedMessage.createdTimestamp),
            },
          ],
          components: [buttons],
        });

        //メッセージリンクだけが投稿された場合の処理
        if (url == message.content) {
          message.delete();
        }
      } catch (err) {
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
    message.content === "omikuji" ||
    message.content === "jinbe" ||
    message.content === "omikujinbe"
  ) {
    const omikuji_choice = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("omi1")
        .setLabel("を引く")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("1️⃣"),
      new ButtonBuilder()
        .setCustomId("omi2")
        .setLabel("を引く")
        .setStyle(ButtonStyle.Success)
        .setEmoji("2️⃣"),
      new ButtonBuilder()
        .setCustomId("omi3")
        .setLabel("を引く")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("3️⃣")
    );
    const replay = await message.channel.send({
      embeds: [
        {
          title: "↓直感で押して！↓",
          color: 0xff0000,
          thumbnail: {
            url: "https://3.bp.blogspot.com/-cPqdLavQBXA/UZNyKhdm8RI/AAAAAAAASiM/NQy6g-muUK0/s400/syougatsu2_omijikuji2.png",
          },
        },
      ],
      // , tic2, tic3
      components: [omikuji_choice],
    });
    await wait(6000);
    replay.delete();
  } else if (message.content === "janken") {
    const janken_choice = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pa")
        .setLabel("パー")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🖐"),
      new ButtonBuilder()
        .setCustomId("cho")
        .setLabel("チョキ")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✌"),
      new ButtonBuilder()
        .setCustomId("gu")
        .setLabel("グー")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✊")
    );
    const replay = await message.channel.send({
      embeds: [
        {
          title: "↓何を出す？！↓",
          color: 0xff0000,
          thumbnail: {
            url: "https://tsukatte.com/wp-content/uploads/2019/03/janken-520x520.png",
          },
        },
      ],
      components: [janken_choice],
    });
    await wait(6000);
    replay.delete();
  }

  // プレフィクスが必要系コマンド
  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  if (command === "nendo_sakaime") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      let response = await message.channel.send({
        content:
          "あなたは、このサーバーの管理者権限を持っていません。\nこのコマンドの実行には管理者権限が必須です。",
      });
      await wait(5000);
      response.delete();
      await wait(1000);
      message.delete();
    } else {
      let today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth() + 1;
      let nendo = month >= 4 ? year : year - 1;
      message.channel.send({
        embeds: [
          {
            title: `これ以降は${nendo}年度の情報です！`,
            color: 0xff0000,
            timestamp: new Date(),
          },
        ],
      });
      message.delete();
    }
  } else if (command === "about") {
    const tic4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(
          "https://discord.com/api/oauth2/authorize?client_id=946587263691788399&permissions=274878000128&scope=bot%20applications.commands"
        )
        .setLabel("BOTを招待する")
        .setStyle(ButtonStyle.Link)
    );
    message.channel.send({
      embeds: [
        {
          title: "このBOTについて",
          description: "作成：Hoshimikan6490",
          color: 3823616,
          timestamp: new Date(),
          thumbnail: {
            url: "attachment://file.png",
          },
        },
      ],
      files: [{ attachment: "photos/jinbe_yoshi.png", name: "file.png" }],
      components: [tic4],
    });
  } else if (command === "ping") {
    message.channel.send({
      embeds: [
        {
          title: "🏓Ping!!",
          description: `Pingは ${
            Date.now() - message.createdTimestamp
          }msです。\n APIのPingは ${Math.round(client.ws.ping)}msです。`,
          color: 15132165,
          timestamp: new Date(),
        },
      ],
    });
  } else if (command === "aisatu_list") {
    message.channel.send({
      embeds: [
        {
          title: "挨拶一覧",
          description:
            "・`jinbeおはよう`\n・`おはようjinbe`\n・`jinbeこんにちは`\n・`こんにちはjinbe`\n・`jinbeこんばんは`\n・`こんばんはjinbe`\n・`jinbeおやすみ`\n・`おやすみjinbe`",
          color: 0x00ff00,
          timestamp: new Date(),
        },
      ],
    });
  } else if (command === "help_omikuji") {
    message.channel.send({
      embeds: [
        {
          title: "omikujiコマンドの使い方",
          description:
            "①「omikuji」と送信する\n\n②３つのボタンから、好きなものを選んで、押す。\n（数秒後にこのメッセージは消えます）\n\n③結果が表示される。",
          color: 0x00ff00,
          timestamp: new Date(),
        },
      ],
    });
  } else {
    message.channel.send({
      embeds: [
        {
          title: "エラー",
          description:
            "申し訳ございません。そのコマンドは見つかりませんでした。\n`mc!help`を実行して、コマンドを確認してください。",
          color: 0xff0000,
          timestamp: new Date(),
        },
      ],
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (
      interaction.customId === "omi1" ||
      interaction.customId === "omi2" ||
      interaction.customId === "omi3"
    ) {
      const arr = [
        "大吉",
        "中吉",
        "小吉",
        "吉",
        "凶",
        "大凶",
        "じんべえ吉",
        "じんべえ凶",
      ];
      const random = Math.floor(Math.random() * arr.length);
      const result = arr[random];

      if (random === 0) {
        var file_pas = "photos/jinbe_daikiti.png";
      } else if (random === 4 || random === 7) {
        var file_pas = "photos/jinbe_pien.png";
      } else if (random === 5) {
        var file_pas = "photos/jinbe_pien2.png";
      } else {
        var file_pas = "photos/jinbe.png";
      }
      if (interaction.customId === "omi1") {
        var number = "1";
      } else if (interaction.customId === "omi2") {
        var number = "2";
      } else {
        var number = "3";
      }

      await interaction.channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [
          {
            title: "おみくじの結果！",
            description: `あなたは、${result}を引きました！\n\n||\`ここだけの話、\`<@${interaction.user.id}> \`さんは、${number}を押したらしいよ...\`||`,
            color: 4817413,
            thumbnail: {
              url: "attachment://omi_kekka.png",
            },
          },
        ],
        files: [{ attachment: file_pas, name: "omi_kekka.png" }],
      });
    }
    // じゃんけんの処理
    if (
      interaction.customId === "pa" ||
      interaction.customId === "cho" ||
      interaction.customId === "gu"
    ) {
      // じんべえの手を決める
      const arr = ["pa", "cho", "gu"];
      const random = Math.floor(Math.random() * arr.length);
      const jinbe = arr[random];
      // 自分の手を「me」に代入
      if (interaction.customId === "pa") {
        var me = "pa";
      } else if (interaction.customId === "cho") {
        var me = "cho";
      } else if (interaction.customId === "gu") {
        var me = "gu";
      }
      // 結果判定
      // 自分がパーの時
      if (interaction.customId === "pa") {
        if (jinbe === "pa") {
          var jan_result = "aiko";
        } else if (jinbe === "cho") {
          var jan_result = "lose";
        } else if (jinbe === "gu") {
          var jan_result = "win";
        }
        // 自分がチョキの時
      } else if (interaction.customId === "cho") {
        if (jinbe === "pa") {
          var jan_result = "win";
        } else if (jinbe === "cho") {
          var jan_result = "aiko";
        } else if (jinbe === "gu") {
          var jan_result = "lose";
        }
      } else if (interaction.customId === "gu") {
        // 自分がグーの時
        if (jinbe === "pa") {
          var jan_result = "lose";
        } else if (jinbe === "cho") {
          var jan_result = "win";
        } else if (jinbe === "gu") {
          var jan_result = "aiko";
        }
      }
      // 変数調整
      //me変数の日本語化
      if (me === "pa") {
        var result_me = "パー";
      } else if (me === "cho") {
        var result_me = "チョキ";
      } else if (me === "gu") {
        var result_me = "グー";
      }
      //jinbe変数の日本語化
      if (jinbe === "pa") {
        var result_jinbe = "パー";
      } else if (jinbe === "cho") {
        var result_jinbe = "チョキ";
      } else if (jinbe === "gu") {
        var result_jinbe = "グー";
      }
      //結果の日本語化
      if (jan_result === "win") {
        var result_jinbe_jp = "あなたの勝ち";
      } else if (jan_result === "aiko") {
        var result_jinbe_jp = "あいこ";
      } else if (jan_result === "lose") {
        var result_jinbe_jp = "あなたの負け";
      }
      // 色調整
      if (jan_result === "win") {
        var color = 0xff0000;
      } else if (jan_result === "aiko") {
        var color = 0xffff00;
      } else if (jan_result === "lose") {
        var color = 0x0000ff;
      }
      // file_pass設定
      if (jan_result === "win") {
        var file_pas = "photos/win.png";
      } else if (jan_result === "aiko") {
        var file_pas = "photos/aiko.png";
      } else if (jan_result === "lose") {
        var file_pas = "photos/lose.png";
      }
      // 結果表示
      await interaction.channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [
          {
            title: "じゃんけんの結果！",
            description: `あなたは ${result_me}を出して、\n私は　${result_jinbe}を出したので、\n\n__**${result_jinbe_jp}です！**__`,
            color: color,
            thumbnail: {
              url: "attachment://omi_kekka.png",
            },
          },
        ],
        files: [{ attachment: file_pas, name: "omi_kekka.png" }],
      });
    }

    if (interaction.customId === "cancel") {
      interaction.message.delete();
    }
  } else if (interaction.type === InteractionType.ApplicationCommand) {
    const command = commands[interaction.commandName];
    try {
      await command?.execute(interaction);
    } catch (error) {
      console.error(error);
    }
  } else {
    return;
  }
});

//Discordへの接続
client.login(token);
