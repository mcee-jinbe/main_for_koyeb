async function deleteUserDBWithoutServerDB() {
  const userDB = require("./models/user_db.js");
  const serverDB = require("./models/server_db.js");

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
}

module.exports = deleteUserDBWithoutServerDB;
