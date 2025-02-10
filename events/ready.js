const { ActivityType } = require("discord.js");
const userDB = require("../models/user_db.js");
const serverDB = require("../models/server_db.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const cron = require("node-cron");
const { formatToTimeZone } = require("date-fns-timezone");
require("dotenv").config();
const fs = require("fs");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

const token = process.env.bot_token;

//誕生日チェック
async function birthday_check(client) {
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
    let birthday_people_id = model[key]._id;

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
          attachment: "./images/jinbe_ome.png",
          name: "happy_birthday.png",
        },
      ],
    });

    //status更新
    model[key].status = "finished";
    model[key].save().catch(async (err) => {
      Sentry.captureException(err);
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

module.exports = async (client) => {
  const rest = new REST({ version: "10" }).setToken(token);
  (async () => {
    try {
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: await client.commands,
      });
      console.log("スラッシュコマンドの再読み込みに成功しました。");
    } catch (err) {
      console.log(
        `❌ スラッシュコマンドの再読み込み時にエラーが発生しました。`
      );
      Sentry.captureException(err);
    }
  })();

  console.log(`${client.user.username}への接続に成功しました。`);

  //シャットダウン中に導入されたサーバーを登録
  let allGuilds = await client.guilds.cache.map((guild) => guild.id);
  await serverDB.find({}).then(async (all_data) => {
    for (let guildId of allGuilds) {
      //全DBのデータ内に参加中のサーバーIDが含まれない場合は登録処理を行う。
      let count = 0;
      for (let data of all_data) {
        if (allGuilds.includes(data._id)) count++;
      }
      if (!count) {
        const profile = await serverDB.create({
          _id: guildId,
          channelID: null,
          status: "false",
        });
        profile.save().catch(async (err) => {
          Sentry.captureException(err);
          client.channels.cache
            .get("889478088486948925")
            .send(
              "内部エラーが発生しました。\n新サーバーの登録時にエラーが発生しました。コンソールを確認してください。"
            );
          return;
        });
        console.log(
          "シャットダウン中に招待されたサーバーのデータを作成しました。"
        );
      }
    }
  });

  //シャットダウン中に退出されたサーバーを登録
  await serverDB.find({}).then(async (all_data) => {
    for (let data of all_data) {
      //全参加中のサーバーの中で、データベースに登録されていないサーバーIDが含まれる場合は登録削除処理を行う。
      let count = 0;
      for (let guildId of allGuilds) {
        if (data._id == guildId) count++;
      }

      if (!count) {
        serverDB
          .deleteOne({ _id: data._id })
          .then(() =>
            console.log(
              "シャットダウン中に退出したサーバーのデータを削除しました。"
            )
          )
          .catch(async (err) => {
            Sentry.captureException(err);
            client.channels.cache
              .get("889478088486948925")
              .send(
                "内部エラーが発生しました。\n新サーバーの登録時にエラーが発生しました。コンソールを確認してください。"
              );
          });
      }
    }
  });

  //サーバーDBにないユーザーDBは削除する
  const deleteUserDBWithoutServerDB = require("../DBcleanupFunction.js");
  await deleteUserDBWithoutServerDB();

  birthday_check(client); //起動時に実行

  cron.schedule(
    "15 8 * * *",
    () => {
      //8:15に実行
      birthday_check(client);
    },
    {
      timezone: "Asia/Tokyo",
    }
  );

  cron.schedule(
    "15 13 * * *",
    () => {
      //13:15に実行
      birthday_check(client);
    },
    {
      timezone: "Asia/Tokyo",
    }
  );

  cron.schedule(
    "45 15 * * *",
    () => {
      //15:45に実行
      birthday_check(client);
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
          Sentry.captureException(err);
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
                  Sentry.captureException(err);
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
  //////////////////////////////////////////////

  setInterval(() => {
    client.user.setActivity(
      `所属サーバー数は、${client.guilds.cache.size}サーバー｜Ping値は、${client.ws.ping}ms｜koyeb.comで起動中です`,
      { type: ActivityType.Listening }
    );
  }, 10000);

  client.channels.cache
    .get("889486664760721418")
    .send("koyeb.comで起動しました！");
};
