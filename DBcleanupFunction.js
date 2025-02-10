async function deleteUserDBWithoutServerDB() {
  const userDB = require("./models/user_db.js");
  const serverDB = require("./models/server_db.js");
  const Sentry = require("@sentry/node");
  // for using sentry
  require("./instrument");

  try {
    let users = await userDB.find();

    for (const key of users) {
      await serverDB
        .findById(key.serverID)
        .catch((err) => {
          Sentry.captureException(err);
        })
        .then((model) => {
          if (!model) {
            userDB
              .deleteOne({ _id: key._id, serverID: key.serverID })
              .catch((err) => {
                Sentry.captureException(err);
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
    Sentry.setTag("Error Point", "DBcleanupFunction");
    Sentry.captureException(err);
  }
}

module.exports = deleteUserDBWithoutServerDB;
