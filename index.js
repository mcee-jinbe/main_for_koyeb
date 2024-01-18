const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

//機密情報取得
const token = process.env["bot_token"];
const mong_db_info = process.env["mongodb_token"];
const PORT = 8000;

//サイト立ち上げ
app.get("/", function (req, res) {
  res.sendStatus(200);
});
app.listen(PORT, () => {
  console.log(`Running on https://jinbe2-hoshimikan.koyeb.app/`);
});

//コマンドをBOTに適応させる準備
client.commands = [];
fs.readdir("./commands", (err, files) => {
  if (err) throw err;
  files.forEach(async (f) => {
    try {
      if (f.endsWith(".js")) {
        let props = require(`./commands/${f}`);
        client.commands.push({
          name: props.name,
          description: props.description,
          options: props.options,
        });
        console.log(`コマンドの読み込みが完了: ${props.name}`);
      }
    } catch (err) {
      console.log(err);
    }
  });
});

//events読み込み
fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    console.log(`クライアントイベントの読み込みが完了: ${eventName}`);
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});

//mongooseについて
mongoose.set("strictQuery", false);
mongoose
  .connect(mong_db_info)
  .then(() => {
    console.log("データベースに接続したんだゾ");
  })
  .catch((err) => {
    console.log(err); //エラー出力
  });

//Discordへの接続
client.login(token);
