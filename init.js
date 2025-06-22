const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, InteractionType } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.type === InteractionType.ModalSubmit) {
    const commandName = interaction.customId.split('-')[0];
    const command = client.commands.get(commandName);
    if (command && typeof command.handleModalSubmit === 'function') {
      try {
        await command.handleModalSubmit(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error handling the modal submission!', ephemeral: true });
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
  }
});

client.login(token);