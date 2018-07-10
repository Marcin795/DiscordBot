const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = require('./settings.json').prefix;
const token = require('./settings.json').token;
const ownerid = require('./settings.json').ownerid;
const mainUrl = require('./settings.json').url;
const group = require('./settings.json').group;
const http = require('http');
const https = require('https');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const spawn = require('child_process').spawn;
require('console-stamp')(console, {
  pattern: 'yyyy-mm-dd HH:MM:ss',
  colors: {
    label: (test) => {
      if(test == '[LOG]') {
        return '[\x1b[37mLOG\x1b[0m]';
      } else
      if(test == '[INFO]') {
        return '[\x1b[36mINFO\x1b[0m]';
      } else
      if(test == '[WARN]') {
        return '[\x1b[33mWARN\x1b[0m]';
      } else
      if(test == '[ERROR]') {
        return '[\x1b[31mERROR\x1b[0m]';
      } else return test;
    }
  }
});

var db = new sqlite3.Database('./plan.db', (err) => {
  if (err) {
    console.error(err.message);
  } else console.info('Connected to database.');
});

var emotki;

const bloki = ['', '8:00-9:35', '9:50-11:25', '11:40-13:15', '13:30-15:05', '15:45-17:20', '17:35-19:10', '19:25-21:00'];

const przedmioty = {
  all: 'Algebra liniowa',
  als: 'Algorytmy i struktury danych',
  am1: 'Analiza matematyczna 1',
  an: 'Analiza matematyczna II',
  aokII: 'Architektura i organizacja komputerów II',
  aok: 'Architektura i organizacja komputerów I',
  f: 'Fizyka',
  md: 'Matematyka dyskretna',
  md2: 'Matematyka dyskretna II',
  peie: 'Podstawy elektrotechniki i elektroniki',
  pnak: 'Programowanie niskopoziomowe i analiza kodu',
  rp: 'Rachunek prawdopodobieństwa',
  tgs: 'Teoria grafów i sieci',
  tik: 'Teoria informacji i kodowania',
  tpi: 'Teoretyczne podstawy informatyki',
  wf: 'Wychowanie fizyczne',
  wdp: 'Wprowadzenie do programowania',
  ppk: 'Podstawy podzespołów komputerów',
  wolne: 'wolne'
}

const commands = {
  help: [
    prefix + 'h',
    prefix + 'help',
    prefix + 'pomoc',
    prefix + 'komendy',
    prefix + 'commands'
  ],
  add: [
    prefix + 'a',
    prefix + 'add',
    prefix + 'nowy',
    prefix + 'nowe',
    prefix + 'nowa',
    prefix + 'dodaj'
  ],
  update: [
    prefix + 'u',
    prefix + 'up',
    prefix + 'update',
    prefix + 'aktualizuj',
    prefix + 'uaktualnij'
  ],
  show: [
    prefix + 's',
    prefix + 'show',
    prefix + 'pokaz',
    prefix + 'pokaż'
  ],
  week: [
    prefix + 'w',
    prefix + 'week',
    prefix + 'tydzien',
    prefix + 'tydzień'
  ],
  tomorrow: [
    prefix + 't',
    prefix + 'jutro',
    prefix + 'tomorrow'
  ],
  mbed: [
    prefix + 'mbed'
  ]
}

client.on('ready', () => {
  console.info('Henlo I works');
  fs.readFile('./emojis/lista.txt', 'utf-8', (err, data) => {
    if(err) return;
    emotki = data.split('\n');
    emotki.forEach((e, i) => {
      emotki[i] = e.split(' ')
    });
  });
  updateDB(updateTable);
  setTimeout(() => { updateDB(updateTable); setInterval(updateDB, 24*60*60*1000); }, moment.duration(moment().endOf('day').add(3, 'hours').diff(moment())).asMilliseconds());
});

client.on('message', message => {
  if(!message.content.startsWith(prefix)) return;
  if(message.author.bot) return;

  var args = message.content.split(' ').slice(1);

  if(message.content.startsWith(prefix + 'ping')) {
    message.channel.send(`pong \`${Date.now() - message.createdTimestamp} ms\``);
  } else

  if(message.content.startsWith(prefix + 'e')) {
    if(args[0] === 'list'){
      var list = client.emojis.map(e => e.toString());
      message.channel.send('Lista: ' + list);
    } else {
      var name = client.emojis.find('name', `${args[0]}`);
      if(name) message.channel.send(`${name}`);
    }
  } else

  if(message.content.startsWith(prefix + 'save')) {
    if(!message.attachments.first()) return;
    var url = message.attachments.first().url;
    var name = message.attachments.first().filename;
    name = name.split('.').slice(-1);
    name = `${args[0]}.${name}`;
    fs.appendFile('./emojis/lista.txt', `${args[0]} ${url}\n`, () => {});
    var tmp = [args[0], url];
    emotki.push(tmp);
    //local save
    //var file = fs.createWriteStream(`./emojis/${name}`);
    //var request = https.get(`${url}`, response => response.pipe(file));
  } else

  if(message.content.startsWith(prefix + 'E')) {
    emotki.forEach(e => {
      if(e[0] == args[0]) {
        message.channel.send({files: [e[1]]});
      }
    });
  } else

  if(checkCommand(message, 'tomorrow')) {
    db.all("SELECT data, blok, przedmiot, typ, numer, sala, wydarzenie FROM plan WHERE data=? ORDER BY blok", [moment().add(1, 'day').format('YYYY-MM-DD')], (err, rows) => {
      if(err) {
        console.error('Line 77: ' + err.message);
      } else {
        var msg = 'Jutro:\n';
        for(var row of rows) {
          msg += ' *' + row.blok +  '* ' + row.przedmiot + ' ' + row.sala;
          if(row.wydarzenie) {
            msg += ' ' + row.wydarzenie;
          }
          msg += '\n';
        }
        if(msg == 'Jutro:\n') {
          msg += 'Wolne!';
        }
        message.channel.send(msg);
      }
    });
  } else

  if(checkCommand(message, 'week')) {
    var tydzien = moment();
    if(moment().day() > 5) {
      tydzien = moment().add(1, 'week').startOf('week');
    }
    db.all("SELECT data, blok, przedmiot, typ, numer, sala, wydarzenie FROM plan WHERE date(data) BETWEEN date(?) AND date(?) ORDER BY data, blok", [tydzien.format('YYYY-MM-DD'), tydzien.startOf('week').add(5, 'day').format('YYYY-MM-DD')], (err, rows) => {
      if(err) {
        console.error('Line 117: ' + err.message);
      } else {
        var msg = 'Tydzień:\n';
        // console.log(rows);
        var nd;
        for(var row of rows) {
          if(nd != row.data) {
            msg += '\n';
          }
          nd = row.data;
          msg += ' **' + moment(row.data).format('M-DD') + '** Blok ' + row.blok +  ' **' + bloki[row.blok] + '** ' + row.przedmiot + ' **' + row.sala + '** ' + row.numer;
          if(row.wydarzenie != null) {
            msg += ' **' + row.wydarzenie + '**';
          }
          msg += '\n';
        }
        // console.log(moment().add(2, 'day').format('YYYY-MM-DD') + ' ' + moment().add(3, 'day').startOf('week').add(5, 'day').format('YYYY-MM-DD'));
        message.channel.send(msg);
      }
    });
  } else

  if(checkCommand(message, 'show')) {
    var msg = ''
    if(message.content.split(' ').length == 1) {
      message.channel.send("Użycie: !show (next|data) [przedmiot]");
    } else {
      if(message.content.split(' ')[1] == 'next') {
        db.get("SELECT data, blok, przedmiot, typ, wydarzenie, komentarz, pomoce FROM plan WHERE data > date('now') AND wydarzenie IS NOT NULL ORDER BY data, blok", (err, row) => {
          if(err) {
            console.error('@!show ' + err.message);
          } else if(row) {
            var displayName = message.member.nickname ? message.member.nickname : message.author.username;
            var description = `**${moment(row.data).locale('pl').format('dd MM-DD')} blok ${row.blok}**`;
            if(row.komentarz) {
              description += '\n' + row.komentarz;
            }
            var fields = [];
            var field = {
              "name": '',
              "value": '',
              "inline": false
            }
            console.log('row.pomoce: ' + row.pomoce);
            if(row.pomoce) {
              for(var record of row.pomoce.split('&&')) {
                console.log('record: ' + record);
                record = record.split(' ');
                fields.push({
                  "name": `${record.pop()}`,
                  "value": `[Link](${record.pop()})` + ' ' + record.join(' '),
                  "inline": false
                });
              }
            }
            const embed = {
              "title": `${row.wydarzenie} z ${row.przedmiot}`,
              "description": description,
              "url": mainUrl + group,
              "color": 16732415,
              "timestamp": moment().toISOString(),
              "footer": {
                "icon_url": message.author.avatarURL,
                "text": `Specjalnie dla ${displayName}`
              },
              "thumbnail": {
                "url": mainUrl + group + '/favicon.png'
              },
              "author": {
                "name": "kekplan.pl",
                "url": mainUrl + group,
                "icon_url": mainUrl + group + '/piesel.png'
              },
              "fields": fields
            };
            message.channel.send({ embed });
          }
        });
      } else {
        date = '2018-' + message.content.split(' ')[1];
        console.log(date);
        db.each("SELECT data, blok, przedmiot, typ, wydarzenie, komentarz, pomoce FROM plan WHERE data=? AND wydarzenie IS NOT NULL", [date], (err, row) => {
          if(err) {
            console.error('@!show ' + err.message);
          } else if(row) {
            var displayName = message.member.nickname ? message.member.nickname : message.author.username;
            var description = `**${moment(row.data).locale('pl').format('dd MM-DD')} blok ${row.blok}**`;
            if(row.komentarz) {
              description += '\n' + row.komentarz;
            }
            var fields = [];
            var field = {
              "name": '',
              "value": '',
              "inline": false
            }
            console.log('row.pomoce: ' + row.pomoce);
            if(row.pomoce) {
              for(var record of row.pomoce.split('&&')) {
                console.log('record: ' + record);
                record = record.split(' ');
                fields.push({
                  "name": `${record.pop()}`,
                  "value": `[Link](${record.pop()})` + ' ' + record.join(' '),
                  "inline": false
                });
              }
            }
            const embed = {
              "title": `${row.wydarzenie} z ${row.przedmiot}`,
              "description": description,
              "url": mainUrl + group,
              "color": 16732415,
              "timestamp": moment().toISOString(),
              "footer": {
                "icon_url": message.author.avatarURL,
                "text": `Specjalnie dla ${displayName}`
              },
              "thumbnail": {
                "url": mainUrl + group + '/favicon.png'
              },
              "author": {
                "name": "kekplan.pl",
                "url": mainUrl + group,
                "icon_url": mainUrl + group + '/piesel.png'
              },
              "fields": fields
            };
            message.channel.send({ embed });
          }
        });
      }
    }
  } else

  if(checkCommand(message, 'add')) {
    console.log(message.content);
    if(message.content.split(' ').length == 1) {
      message.channel.send("Użycie: !add (next|data|numer|poprawa) przedmiot typ wydarzenie opis [data i blok poprawy]");
    } else {
      resolveDate(message.content, (data) => {
        console.log(data);
        console.log(data[0] + ' ' + data[1]);
        db.run("UPDATE plan SET wydarzenie=? WHERE data=? and blok=?", [message.content.split(' ')[4], data[0], data[1]], (err) => {
          if(err) {
            console.error('@!add ' + err.message);
          } else {
            console.log('Updated plan, set wydarzenie to ' + message.content.split(' ')[4]);
            updateTable(0);
          }
        });
      });
    }
  } else

  if(checkCommand(message, 'update')) {
    console.log(message.conent + ' ' + message.author);
    if(message.content.split(' ').length == 1) {
      message.channel.send("Użycie: !update (next|data|numer|numer z listy) przedmiot typ opis link");
    } else {
      var msg = message.content.split(' ');
      console.log('msg: ' + msg);
      var displayName = message.member.nickname ? message.member.nickname : message.author.username;
      msg.shift();
      console.log('msg1: ' + msg);
      msg.shift();
      console.log('msg2: ' + msg);
      msg.shift();
      console.log('msg3: ' + msg);
      msg.shift();
      console.log('msg4: ' + msg);
      msg = msg.join(' ');
      console.log('msg5: ' + msg);
      console.log(typeof msg);
      msg += ' ' + displayName;
      resolveDate(message.content, (data) => {
        db.get("SELECT pomoce FROM plan WHERE data=? AND blok=?", [data[0], data[1]], (err, row) => {
          if(err) {
            console.error('@!update#SELECT ' + err.message);
          } else if(row) {
            console.log('Select row.pomoce: ' + row.pomoce);
            msg += '&&' + row.pomoce;
            db.run("UPDATE plan SET pomoce=? WHERE data=? AND blok=?", [msg, data[0], data[1]], (err) => {
              if(err) {
                console.error('@!update#UPDATE ' + err.message);
              } else {
                console.log('Updated plan, set pomoce to ' + msg);
                updateTable(0);
              }
            });
          }
        });
      });
    }
  } else

  if(checkCommand(message, 'help')) {
    var msg = 'Komendy:\n'
    for(var command in commands) {
      msg += '**' + prefix + command + '**\n';
    }
    message.channel.send(msg);
  } else

  if(message.content.startsWith(prefix)) {
    var msg = 'Użyj !help aby wypisać dostępne komendy!';
    message.channel.send(msg);
  }
});

client.login(token);

function resolveDate(str, callback) {
  str = str.split(' ');
  if(str[1] == 'next') {
    db.get("SELECT data, blok FROM plan WHERE przedmiot=? AND typ=? AND data > date('now') ORDER BY data", [przedmioty[str[2]], str[3]], (err, row) => {
      let data = [];
      if(err) {
        console.error('@resolveDate#next ' + err.message);
      } else if(row) {
        console.log('row.data: ' + row.data + ' ' + row.blok);
        data[0] = row.data;
        data[1] = row.blok;
        console.log('data: ' + data);
      }
      console.log('resolveDate callback!');
      callback(data);
    });
  } else if(isNaN(str[1])) {
    db.get("SELECT data, blok FROM plan WHERE przedmiot=? AND typ=? AND data=? ORDER BY blok", [przedmioty[str[2]], str[3], str[1]], (err, row) => {
      let data = [];
      if(err) {
        console.error('@resolveDate#data ' + err.message);
      } else if(row) {
        console.log('row.data: ' + row.data + ' ' + row.blok);
        data[0] = row.data;
        data[1] = row.blok;
        console.log('data: ' + data);
      }
      console.log('resolveDate callback!');
      callback(data);
    });
  } else if(!isNaN(str[1])) {
    db.get("SELECT data, blok FROM plan WHERE przedmiot=? AND typ=? AND numer=?", [przedmioty[str[2]], str[3], str[1]], (err, row) => {
      let data = [];
      if(err) {
        console.error('@resolveDate#numer ' + err.message);
      } else if(row) {
        console.log('row.data: ' + row.data + ' ' + row.blok);
        data[0] = row.data;
        data[1] = row.blok;
        console.log('data: ' + data);
      }
      console.log('resolveDate callback!');
      callback(data);
    });
  }
}

function updateDB(callback) {
  console.log('Starting database update!');
  var loadDB = spawn('node', ['./loadDB.js']);
  loadDB.on('exit', (code) => {
    console.log(`loadDB.js ended with code ${code}`);
    if(!code) {
      console.log('Database updated successfully!');
      callback(0);
    } else if(code == 503) {
      console.info('Server is down (again), trying again in 1 hour');
      setTimeout(updateDB, 1000*60*60);
    }
  });
}

function updateTable(arg) {
  console.log('Refreshing plan.html!');
  var htmlGen = spawn('node', ['./htmlGen.js']);
  htmlGen.on('exit', (code) => {
    console.log(`htmlGen.js ended with code ${code}`);
    if(!code) {
      console.log('plan.html refreshed successfully');
    } else if(arg < 3){
      console.warn('Something went wrong, retrying...');
      updateTable(++arg);
    } else if(arg < 7){
      console.warn("Can't update plan.html, trying again in 1 hour.");
      setTimeout(() => { updateTable(++arg) }, 1000*60*60);
    } else {
      client.fetchUser(ownerid).then((owner) => {owner.send("htmlGen.js mógł się popsuć! " + (arg+1) + ' nieudanych prób.')});
      setTimeout(() => { updateTable(++arg) }, 1000*60*60);
    }
  })
}

function checkCommand(message, command) {
  for(var check of commands[command]) {
    // if(message.content.startsWith(check)) {
    // console.log(check);
    if(message.content.split(' ')[0] == check) {
      return 1;
    }
  }
  return 0;
}
