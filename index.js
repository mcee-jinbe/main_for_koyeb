const fs = require('fs');
// Discord bot implements
const {
  Client,
  GatewayIntentBits,
  InteractionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});
module.exports.client = client;
const cron = require('node-cron');
const { formatToTimeZone } = require('date-fns-timezone');
const mongoose = require('mongoose');
const profileModel = require('./models/profileSchema');
const prefix = 'mc!';
const util = require('util');
const wait = util.promisify(setTimeout);
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

//機密情報取得
const token = process.env['bot_token'];
const mong_db_info = process.env['mongodb_token'];
const url_check_api = process.env['url_check_api'];

const commands = {};
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command;
}

// 誕生日チェック
async function birthday_check() {
  const FORMAT = 'MM-DD';
  let now = new Date();
  let today = formatToTimeZone(now, FORMAT, { timeZone: 'Asia/Tokyo' });
  let today_month = today.split('-')[0];
  let today_day = String(parseInt(today.split('-')[1])); // 先頭の0を削除するためにString(parseInt())を入れている
  let model = await profileModel.find({
    birthday_month: today_month,
    birthday_day: today_day,
  });

  if (!model.length) {
    console.log(
      `今日(${today_month}月${today_day}日)、誕生日の人は確認できませんでした。`
    );
    return;
  }

  for (const key in model) {
    // めでたい人の情報を取得して定義
    let birthday_man_id = model[key]._id;
    let birthday_status = model[key].status;

    if (birthday_status !== 'finished') {
      //誕生日を祝う
      client.channels.cache.get('1037904694598713516').send({
        content: `<@${birthday_man_id}>`,
        embeds: [
          {
            title: 'お誕生日おめでとうございます！',
            description: `今日は、<@${birthday_man_id}>さんのお誕生日です！`,
            color: 0xff00ff,
            thumbnail: {
              url: 'attachment://happy_birthday.png',
            },
          },
        ],
        files: [
          {
            attachment: './photos/jinbe_ome.png',
            name: 'happy_birthday.png',
          },
        ],
      });

      //status更新
      model[key].status = 'finished';
      model[key].save().catch(async (err) => {
        console.log(err);
        client.channels.cache
          .get('1037904694598713516')
          .send(
            '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\n誕生日statusの更新時にエラーが発生しました。\nコンソールを確認してください。'
          );
        return;
      });
    }
  }
}

// botが準備できれば発動され、 上から順に処理される。
client.once('ready', async () => {
  const data = [];
  for (const commandName in commands) {
    data.push(commands[commandName].data);
  }
  await client.application.commands.set(data);
  console.log('Ready!');

  setInterval(() => {
    client.user.setActivity({
      name: `所属サーバー数は、${client.guilds.cache.size}サーバー｜Ping値は、${client.ws.ping}ms｜railway.appで起動中です`,
    });
  }, 10000);

  birthday_check(); //起動時に実行

  cron.schedule('15 8 * * *', () => {
    //8:15に実行
    birthday_check();
  });

  cron.schedule('15 13 * * *', () => {
    //13:15に実行
    birthday_check();
  });

  cron.schedule('45 15 * * *', () => {
    //15:45に実行
    birthday_check();
  });

  cron.schedule('59 23 31 12 *', () => {
    //12/31 23:59にリセット
    profileModel.find({}, function (err, model) {
      if (err) {
        console.log(err.message);
        client.channels.cache
          .get('1037904694598713516')
          .send(
            '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\n誕生日statusの更新時にエラーが発生しました。\nコンソールを確認してください。'
          );
        return;
      }

      //status更新
      for (const key in model) {
        model[key].status = 'yet';
        model[key].save(function (err, model) {
          if (err) {
            console.log(err.message);
            client.channels.cache
              .get('1037904694598713516')
              .send(
                '申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\n誕生日statusの更新時にエラーが発生しました。\nコンソールを確認してください。'
              );
            return;
          }
        });
      }
    });
  });

  client.channels.cache
    .get('889486664760721418')
    .send('railway.appで起動しました！');
});

//mongooseについて
mongoose.set('strictQuery', false);
mongoose
  .connect(mong_db_info, {
    useNewUrlParser: true, //任意
  })
  .then(() => {
    console.log('データベースに接続したんだゾ');
  })
  .catch((error) => {
    console.log(error); //エラー出力
  });

//　ユーザー参加時の処理
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id == '768073209169444884') {
    const user_id = member.id;
    //先ほど作成したスキーマを参照
    let user = await profileModel.findOne({ _id: user_id });

    if (!user) {
      const user_name = (await client.users.fetch(user_id)).username;
      const profile = await profileModel.create({
        _id: user_id, //ユーザーID
        user_name: user_name, //ユーザーネーム
        birthday_month: 'no_data',
        birthday_day: 'no_data',
        status: 'yet',
      });
      profile.save();
      console.log('新規参加者をデータベースに登録したよ！');
    } else {
      client.channels.cache
        .get('889478088486948925')
        .send(
          `<@728495196303523900> マイクラ班discordに新規参加したユーザー（ユーザーID: \`${user_id}\`）は、すでにデータが存在したため、登録処理をスキップしました。`
        );
    }
  } else {
    console.log(
      'マイクラ班サーバー以外への参加者のため、データベース登録をスキップしました。'
    );
  }
});

//URLチェックの動作を指定
async function getSafe(urls, message) {
  let request_url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${url_check_api}`;

  let data = {
    client: {
      clientId: 'jinbe',
      clientVersion: '1.5.2',
    },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
      platformTypes: ['WINDOWS'],
      threatEntryTypes: ['URL'],
      threatEntries: urls.map((f) => {
        return { url: f };
      }),
    },
  };

  fetch(request_url, {
    method: 'POST', // or 'PUT'
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if ('matches' in data) {
        message.channel.send({
          embeds: [
            {
              title: '⚠⚠⚠危険なURLを検知しました！⚠⚠⚠',
              description: `<@${message.author.id}> が投稿した内容には、__危険なURLが含まれる可能性が高いです__\n\n__**絶対に、アクセスしないでください!**__`,
              color: 0xff0000,
              footer: {
                text: 'アクセスする際は、自己責任でお願いいたします。',
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
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  //危険なURLに警告
  let urls = String(message.content).match(
    /https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#\u3000-\u30FE\u4E00-\u9FA0\uFF01-\uFFE3]+/g
  );
  if (urls) {
    getSafe(urls, message);
  }

  // プレフィクスが要らない系コマンド
  if (
    message.content.match(/jinbeおはよう/) ||
    message.content.match(/おはようjinbe/)
  ) {
    message.channel.send('おはよう！');
  } else if (
    message.content.match(/jinbeこんにちは/) ||
    message.content.match(/こんにちはjinbe/)
  ) {
    message.channel.send('こんにちわああああ！');
  } else if (
    message.content.match(/jinbeこんばんは/) ||
    message.content.match(/こんばんはjinbe/)
  ) {
    message.channel.send('こんばんわ！！');
  } else if (
    message.content.match(/jinbeおやすみ/) ||
    message.content.match(/おやすみjinbe/)
  ) {
    message.channel.send('おやすみ～\nいい夢見てね…');
  } else if (
    message.content === 'omikuji' ||
    message.content === 'jinbe' ||
    message.content === 'omikujinbe'
  ) {
    const omikuji_choice = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('omi1')
        .setLabel('を引く')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1️⃣'),
      new ButtonBuilder()
        .setCustomId('omi2')
        .setLabel('を引く')
        .setStyle(ButtonStyle.Success)
        .setEmoji('2️⃣'),
      new ButtonBuilder()
        .setCustomId('omi3')
        .setLabel('を引く')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('3️⃣')
    );
    const replay = await message.channel.send({
      embeds: [
        {
          title: '↓直感で押して！↓',
          color: 0xff0000,
          thumbnail: {
            url: 'https://3.bp.blogspot.com/-cPqdLavQBXA/UZNyKhdm8RI/AAAAAAAASiM/NQy6g-muUK0/s400/syougatsu2_omijikuji2.png',
          },
        },
      ],
      // , tic2, tic3
      components: [omikuji_choice],
    });
    await wait(6000);
    replay.delete();
  } else if (message.content === 'janken') {
    const janken_choice = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pa')
        .setLabel('パー')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🖐'),
      new ButtonBuilder()
        .setCustomId('cho')
        .setLabel('チョキ')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✌'),
      new ButtonBuilder()
        .setCustomId('gu')
        .setLabel('グー')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✊')
    );
    const replay = await message.channel.send({
      embeds: [
        {
          title: '↓何を出す？！↓',
          color: 0xff0000,
          thumbnail: {
            url: 'https://tsukatte.com/wp-content/uploads/2019/03/janken-520x520.png',
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
  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  let cancel_button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('このメッセージを削除する')
      .setStyle(ButtonStyle.Secondary)
  );

  if (command === '2022') {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      let response = await message.channel.send({
        content:
          'あなたは、このサーバーの管理者権限を持っていません。\nこのコマンドの実行には管理者権限が必須です。',
      });
      await wait(5000);
      response.delete();
      await wait(1000);
      message.delete();
    } else {
      message.channel.send({
        embeds: [
          {
            title: 'これ以降は2022年度の情報です！',
            color: 0xff0000,
            timestamp: new Date(),
          },
        ],
      });
      message.delete();
    }
  } else if (command === 'about') {
    const tic4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(
          'https://discord.com/api/oauth2/authorize?client_id=946587263691788399&permissions=274878000128&scope=bot'
        )
        .setLabel('BOTを招待する')
        .setStyle(ButtonStyle.Link)
    );
    message.channel.send({
      embeds: [
        {
          title: 'このBOTについて',
          description: '作成：Hoshimikan6490',
          color: 3823616,
          timestamp: new Date(),
          thumbnail: {
            url: 'attachment://file.png',
          },
        },
      ],
      files: [{ attachment: 'photos/jinbe_yoshi.png', name: 'file.png' }],
      components: [tic4],
    });
  } else if (command === 'ping') {
    message.channel.send({
      embeds: [
        {
          title: '🏓Ping!!',
          description: `Pingは ${
            Date.now() - message.createdTimestamp
          }msです。\n APIのPingは ${Math.round(client.ws.ping)}msです。`,
          color: 15132165,
          timestamp: new Date(),
        },
      ],
    });
  } else if (command === 'aisatu_list') {
    message.channel.send({
      embeds: [
        {
          title: '挨拶一覧',
          description:
            '・`jinbeおはよう`\n・`おはようjinbe`\n・`jinbeこんにちは`\n・`こんにちはjinbe`\n・`jinbeこんばんは`\n・`こんばんはjinbe`\n・`jinbeおやすみ`\n・`おやすみjinbe`',
          color: 0x00ff00,
          timestamp: new Date(),
        },
      ],
    });
  } else if (command === 'help_omikuji') {
    message.channel.send({
      embeds: [
        {
          title: 'omikujiコマンドの使い方',
          description:
            '①「omikuji」と送信する\n\n②３つのボタンから、好きなものを選んで、押す。\n（数秒後にこのメッセージは消えます）\n\n③結果が表示される。',
          color: 0x00ff00,
          timestamp: new Date(),
        },
      ],
    });
  } else {
    message.channel.send({
      embeds: [
        {
          title: 'エラー',
          description:
            '申し訳ございません。そのコマンドは見つかりませんでした。\n`mc!help`を実行して、コマンドを確認してください。',
          color: 0xff0000,
          timestamp: new Date(),
        },
      ],
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (
    interaction.customId === 'omi1' ||
    interaction.customId === 'omi2' ||
    interaction.customId === 'omi3'
  ) {
    const wait = require('node:timers/promises').setTimeout;
    const arr = [
      '大吉',
      '中吉',
      '小吉',
      '吉',
      '凶',
      '大凶',
      'じんべえ吉',
      'じんべえ凶',
    ];
    const random = Math.floor(Math.random() * arr.length);
    const result = arr[random];

    if (random === 0) {
      var file_pas = 'photos/jinbe_daikiti.png';
    } else if (random === 4 || random === 7) {
      var file_pas = 'photos/jinbe_pien.png';
    } else if (random === 5) {
      var file_pas = 'photos/jinbe_pien2.png';
    } else {
      var file_pas = 'photos/jinbe.png';
    }
    if (interaction.customId === 'omi1') {
      var number = '1';
    } else if (interaction.customId === 'omi2') {
      var number = '2';
    } else {
      var number = '3';
    }

    await interaction.channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [
        {
          title: 'おみくじの結果！',
          description: `あなたは、${result}を引きました！\n\n||\`ここだけの話、\`<@${interaction.user.id}> \`さんは、${number}を押したらしいよ...\`||`,
          color: 4817413,
          thumbnail: {
            url: 'attachment://omi_kekka.png',
          },
        },
      ],
      files: [{ attachment: file_pas, name: 'omi_kekka.png' }],
    });
  }
  // じゃんけんの処理
  if (
    interaction.customId === 'pa' ||
    interaction.customId === 'cho' ||
    interaction.customId === 'gu'
  ) {
    const wait = require('node:timers/promises').setTimeout;
    // じんべえの手を決める
    const arr = ['pa', 'cho', 'gu'];
    const random = Math.floor(Math.random() * arr.length);
    const jinbe = arr[random];
    // 自分の手を「me」に代入
    if (interaction.customId === 'pa') {
      var me = 'pa';
    } else if (interaction.customId === 'cho') {
      var me = 'cho';
    } else if (interaction.customId === 'gu') {
      var me = 'gu';
    }
    // 結果判定
    // 自分がパーの時
    if (interaction.customId === 'pa') {
      if (jinbe === 'pa') {
        var jan_result = 'aiko';
      } else if (jinbe === 'cho') {
        var jan_result = 'lose';
      } else if (jinbe === 'gu') {
        var jan_result = 'win';
      }
      // 自分がチョキの時
    } else if (interaction.customId === 'cho') {
      if (jinbe === 'pa') {
        var jan_result = 'win';
      } else if (jinbe === 'cho') {
        var jan_result = 'aiko';
      } else if (jinbe === 'gu') {
        var jan_result = 'lose';
      }
    } else if (interaction.customId === 'gu') {
      // 自分がグーの時
      if (jinbe === 'pa') {
        var jan_result = 'lose';
      } else if (jinbe === 'cho') {
        var jan_result = 'win';
      } else if (jinbe === 'gu') {
        var jan_result = 'aiko';
      }
    }
    // 変数調整
    //me変数の日本語化
    if (me === 'pa') {
      var result_me = 'パー';
    } else if (me === 'cho') {
      var result_me = 'チョキ';
    } else if (me === 'gu') {
      var result_me = 'グー';
    }
    //jinbe変数の日本語化
    if (jinbe === 'pa') {
      var result_jinbe = 'パー';
    } else if (jinbe === 'cho') {
      var result_jinbe = 'チョキ';
    } else if (jinbe === 'gu') {
      var result_jinbe = 'グー';
    }
    //結果の日本語化
    if (jan_result === 'win') {
      var result_jinbe_jp = 'あなたの勝ち';
    } else if (jan_result === 'aiko') {
      var result_jinbe_jp = 'あいこ';
    } else if (jan_result === 'lose') {
      var result_jinbe_jp = 'あなたの負け';
    }
    // 色調整
    if (jan_result === 'win') {
      var color = 0xff0000;
    } else if (jan_result === 'aiko') {
      var color = 0xffff00;
    } else if (jan_result === 'lose') {
      var color = 0x0000ff;
    }
    // file_pass設定
    if (jan_result === 'win') {
      var file_pas = 'photos/win.png';
    } else if (jan_result === 'aiko') {
      var file_pas = 'photos/aiko.png';
    } else if (jan_result === 'lose') {
      var file_pas = 'photos/lose.png';
    }
    // 結果表示
    await interaction.channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [
        {
          title: 'じゃんけんの結果！',
          description: `あなたは ${result_me}を出して、\n私は　${result_jinbe}を出したので、\n\n__**${result_jinbe_jp}です！**__`,
          color: color,
          thumbnail: {
            url: 'attachment://omi_kekka.png',
          },
        },
      ],
      files: [{ attachment: file_pas, name: 'omi_kekka.png' }],
    });
  }

  if (interaction.customId === 'cancel') {
    interaction.message.delete();
  }

  if (interaction.customId === 'delete_database_Yes') {
    const model = require('./models/profileSchema');
    model.deleteMany({}, function (err) {
      if (err) {
        interaction.reply(
          '内部エラーが発生しました。\nコンソールを確認してください！'
        );
        console.error(err);
      } else {
        interaction.reply('✅削除しました！');
      }
    });
    interaction.message.delete();
  }
  if (interaction.customId === 'delete_database_No') {
    interaction.message.delete();
  }

  if (!interaction.type === InteractionType.ApplicationCommand) {
    return;
  }
  const command = commands[interaction.commandName];
  try {
    await command?.execute(interaction);
  } catch (error) {
    console.error(error);
  }
});

//Discordへの接続
client.login(token);
