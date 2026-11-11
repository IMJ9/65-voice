const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN || !CHANNEL_ID) {
  throw new Error('Set BOT_TOKEN and CHANNEL_ID in the hosting environment.');
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive and running!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let reconnecting = false;

async function connectToVoice() {
  if (reconnecting || !client.isReady()) return;
  reconnecting = true;

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isVoiceBased() || !channel.guild) {
      throw new Error('CHANNEL_ID must be a valid voice channel ID.');
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        ]);
      } catch {
        connection.destroy();
        setTimeout(() => {
          reconnecting = false;
          connectToVoice().catch(console.error);
        }, 5_000);
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      reconnecting = false;
    });

    connection.on('error', console.error);
    console.log(`Connecting to voice channel ${channel.id}`);
  } catch (error) {
    console.error('Voice connection failed:', error);
    setTimeout(() => {
      reconnecting = false;
      connectToVoice().catch(console.error);
    }, 15_000);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  connectToVoice().catch(console.error);
});

client.login(TOKEN);
