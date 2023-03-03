// init project
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');

const { Client, EmbedBuilder, GatewayIntentBits, Guild } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent] });

//// IMPORTANT VVV
let universeID = 00000; // Your Game Universe ID
let rolename = 'Admin'; // Admin role that can use the bot
let prefix = '!'; // Discord bot prefix
let datastoreApiKey = 'Your Datastore Api Key Here';
let botToken = 'Your Discord Bot Token Here'; // (Discord bot)
/// IMPORTANT ^^^

let numbers = [
    "0️⃣",
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣"
]
var toBan = [];

async function startApp() {
    var promise = client.login(botToken)
    console.log("Starting...");
    promise.catch(function(error) {
        console.error("Discord bot login | " + error);
        process.exit(1);
    });
}
startApp();
client.on("ready", () => {
    console.log(`Successfully logged in ${client.user.tag}`);
})

const Invalid = new EmbedBuilder()
    .setColor('#eb4034')
    .setDescription("Invalid user")

const footer = {
    text: 'Forked by corehimself'
};

function byUID(method, usr, message) {
    const Emb = new EmbedBuilder()
        .setColor('#fff200')
        //.setTitle(request.headers.username + "'s Data")
        // .setTitle("Attempt")
        //.setAuthor('Roblox Error','')
        .setDescription("Attempting to " + method + " UserID " + usr + "...")
        .setTimestamp()
        .setFooter(footer);
    
    message.edit({ embeds: [Emb] });
    https.get("https://api.roblox.com/users/" + usr, (res) => {
        
        let data = '';
        res.on('data', d => {
            data += d
        })
        res.on('end', () => {
            if (res.statusCode == 200) {
                toBan.push({ method: method, username: JSON.parse(data).Username, value: usr, cid: message.channel.id, mid: message.id });
            } else {
                message.edit({ embeds: [Invalid] });
            }
        });
    }).on('error', error => {
        console.error("RBLX API (UID) | " + error);
    });
}

async function handleDataResponse(userID, method, msg, username) {
    let entryKey = `user_${userID}`;
    const JSONValue = await JSON.stringify(method);
    const ConvertAdd = await crypto.createHash("md5").update(JSONValue).digest("base64")
    const response = await axios.post(
        `https://apis.roblox.com/datastores/v1/universes/${universeID}/standard-datastores/datastore/entries/entry`,
        method,
        {
            params: {
                'datastoreName': 'DTRD',
                'entryKey': entryKey
            },
            headers: {
                'x-api-key': datastoreApiKey,
                'content-md5': ConvertAdd,
                'content-type': 'application/json',
            }
        }
    ).catch(err => {
        console.log(err.response.data);
    })

    if (response && response.data) {
        const embed = new EmbedBuilder()
            .setColor('#00ff44')
            .setTitle(`${method} Successful`)
            .addFields({ name: 'Username', value: `${username}` })
            .addFields({ name: 'UserID', value: `${userID}` })
            .setTimestamp()
            .setFooter(footer);

        const channel = await client.channels.cache.get(msg.channel.id);
        const msgObj = await channel.messages.fetch(msg.id);
        if (msgObj !== undefined) {
            msgObj.edit({ embeds: [embed] });
        } else {
            msgObj.send({ embeds: [embed] });
        }
    } else {
        const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setTitle(`${method} Failed`)
            .addFields({ name: 'Username', value: `${username}` })
            .addFields({ name: 'UserID', value: `${userID}` })
            .setTimestamp()
            .setFooter(footer);

        const channel = await client.channels.cache.get(msg.channel.id);
        const msgObj = await channel.messages.fetch(msg.id);
        if (msgObj != undefined) {
            msgObj.edit({ embeds: [embed] });
        } else {
            msgObj.send({ embeds: [embed] });
        }
    }
}

function byUser(method, usr, message) {
    const Emb = new EmbedBuilder()
        .setColor('#fff200')
        //.setTitle(request.headers.username + "'s Data")
        // .setTitle("Attempt")
        //.setAuthor('Roblox Error','')
        .setDescription("Attempting to " + method + " username " + usr + "...")
        .setTimestamp()
        .setFooter(footer);
    message.edit({ embeds: [Emb] });
    https.get("https://api.roblox.com/users/get-by-username?username=" + usr, (res) => {
        let data = '';
        res.on('data', d => {
            data += d
        })
        res.on('end', () => {
            if (JSON.parse(data).Id != undefined) {
                toBan.push({ method: method, value: JSON.parse(data).Id, username: JSON.parse(data).Username, cid: message.channel.id, mid: message.id });
                handleDataResponse(JSON.parse(data).Id, method, message, JSON.parse(data).Username);
                toBan.shift();
            } else {
                message.edit({ embeds: [Invalid] });
            }
        });
    }).on('error', error => {
        console.error("RBLX API (Username) | " + error);
    });
}

function isCommand(command, message) {
    var command = command.toLowerCase();
    var content = message.content.toLowerCase();
    return content.startsWith(prefix + command);
}

const TookTooLong = new EmbedBuilder()
    .setColor('#eb4034')
    .setDescription("You took too long to respond!")

async function determineType(method, msg, BotMsg, args) {
    if (isNaN(Number(args[1]))) {
        byUser(method, args[1], BotMsg);
    } else {
        const Emb = new EmbedBuilder()
            .setColor('#ea00ff')
            .setTitle("Is this a UserID or a Username?")
            .setDescription("Please react with the number that matches the answer.")
            .addFields({ name: numbers[0] + ": Username", value: "This is a player's username in game" })
            .addFields({ name: numbers[1] + ": UserID", value: "This is the player's UserID connected with the account" })
            .setTimestamp()
            .setFooter(footer);
        BotMsg.edit({ embeds: [Emb] });
        try {
            await BotMsg.react(numbers[0]);
            await BotMsg.react(numbers[1]);
        } catch (error) {
            console.error('One of the emojis failed to react.');
        }
        try {
            const filter = (reaction, user) => {
                return numbers.includes(reaction?.emoji?.name) && user.id === msg.author.id;
            };
            
            BotMsg.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();
                    const ind = numbers.findIndex(function(n) {
                        return n == reaction.emoji.name;
                    });
                    BotMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                    
                    if (ind == 0) {
                        byUser(method, args[1], BotMsg);
                    } else if (ind == 1) {
                        byUID(method, args[1], BotMsg);
                    } else {
                        BotMsg.edit({ embeds: [Invalid] });
                    }
                })
                .catch(collected => {
                    BotMsg.edit({ embeds: [TookTooLong] });
                    BotMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                });
        } catch (error) {
            console.log('error:', error);
        }
    }
}
      
    

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.member.roles.cache.some(role => role.name === rolename)) {
        const args = message.content.slice(prefix.length).split(' ');
        var Emb = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription("Working...")
        
        if (isCommand("Ban", message)) {
            var BotMsg = await message.channel.send({ embeds: [Emb] });
            determineType("Ban", message, BotMsg, args);
        } else if (isCommand("Unban", message)) {
            var BotMsg = await message.channel.send({ embeds: [Emb] });
            determineType("Unban", message, BotMsg, args);
        } else if (isCommand("Kick", message)) {
            var BotMsg = await message.channel.send({ embeds: [Emb] });
            determineType("Kick", message, BotMsg, args);
        }
    }
});

client.on('error', console.error);