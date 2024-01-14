const serverDB = require("../models/server_db.js");

module.exports = async (client, guild) => {
  try {
    const profile = await serverDB.findOne({
      _id: guild.id,
    });

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
    }
  } catch (err) {
    const errorNotification = require("../functions.js");
    errorNotification(client, guild, err);
  }
};
