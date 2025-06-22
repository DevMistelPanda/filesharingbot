const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load commands from commands folder
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (guild) commands.');

    // Delete ALL existing guild commands (clean slate)
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }
    );
    console.log('Deleted all old guild commands.');

    // Deploy current commands
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log('Successfully reloaded application (guild) commands.');
  } catch (error) {
    console.error(error);    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      commands.push(command.data.toJSON());
    }
  }
})();
