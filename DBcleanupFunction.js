async function deleteUserDBWithoutServerDB() {
  const userDB = require("./models/user_db.js");
  const serverDB = require("./models/server_db.js");

  try {
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
        });
    }
  } catch (err) {
    err.id = "DBcleanupFunction";
    const errorNotification = require("../errorFunction.js");
    errorNotification(client, interaction, err);
  }
}

module.exports = deleteUserDBWithoutServerDB;
