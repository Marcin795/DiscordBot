const Discord = require('discord.js');
const client = new Discord.Client();
const token = require('./settings.json').token;
const http = require('http');
const https = require('https');
const fs = require('fs');

client.on('ready', () => {
  console.log('Henlo I works');
});

var prefix = "!";
client.on('message', message => {
  if(!message.content.startsWith(prefix)) return;
  if(message.author.bot) return;

  var args = message.content.split(' ').slice(1);

  if(message.content.startsWith(prefix + 'ping')){
    message.channel.send(`pong \`${Date.now() - message.createdTimestamp} ms\``);
  } else

  if(message.content.startsWith(prefix + 'e')){
    if(args[0] === 'list'){
      var list = client.emojis.map(e => e.toString());
      message.channel.send(list);
    } else {
      var name = client.emojis.find('name', `${args[0]}`);
      if(name) message.channel.send(`${name}`);
    }
  } else

  if(message.content.startsWith(prefix + 'save')){
    var url = message.attachments.first().url;
    var name = message.attachments.first().filename;
    name = name.split('.').slice(-1);
    name = `${args[0]}.${name}`;
    var file = fs.createWriteStream(`./emojis/${name}`);
    var request = https.get(`${url}`, response => response.pipe(file));
  } else

  if(message.content.startsWith(prefix + 'kott')){
    message.channel.send({files: ['./emojis/kott.jpg']});
  } else

  if(message.content.startsWith(prefix + 'E')){
    message.channel.send('TBD');
    message.channel.send('Tu Bedo Duze emotki');
  }

});

client.login(token);
