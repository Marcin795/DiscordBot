const Discord = require('discord.js');
const client = new Discord.Client();
const token = require('./settings.json').token;
const avatar = require('./settings.json').avatar;
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
      const list = client.emojis.map(e => e.toString());
      message.channel.send(list);
    } else {
      const name = client.emojis.find('name', `${args[0]}`);
      message.channel.send(`${name}`);
    }
  } else

  if(message.content.startsWith(prefix + 'add')){
    const guild = message.guild;
    guild.createEmoji('./emojis/nz.png', 'BB');
  } else

  if(message.content.startsWith(prefix + 'save')){
    const url = message.attachments.first().url;
    const name = message.attachments.first().filename;
    const file = fs.createWriteStream(`./emojis/${name}`);
    var request = https.get(`${url}`, response => response.pipe(file));
  }

  if(message.content.startsWith(prefix + 'kott')){
    const bot = message.guild.members.get(client.user.id);
    const user = message.guild.members.get(message.author.id);
    message.delete()
    bot.setNickname(user.nickname);
    message.channel.send({files: ['./emojis/kott.jpg']});
    bot.setNickname('Test Bot');
  }

  

});

client.login(token);
