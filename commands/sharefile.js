const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const formatDate = require('../utils/formatDate');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sharefile')
    .setDescription('Share a file with metadata')
    .addStringOption(option =>
        option.setName('link').setDescription('The Link to your File').setRequired(true))
    .addStringOption(option =>
      option.setName('title').setDescription('The title of the file').setRequired(true))
    .addStringOption(option =>
      option.setName('details').setDescription('Optional details').setRequired(false))
    .addStringOption(option =>
      option.setName('lastupdate').setDescription('Last update date/time').setRequired(false))
    .addUserOption(option =>
      option.setName('mention').setDescription('Tag a user')),
    
  async execute(interaction) {
    const title = interaction.options.getString('title');
    const link = interaction.options.getString('link');
    const details = interaction.options.getString('details');
    const lastUpdateInput = interaction.options.getString('lastupdate');
    const mention = interaction.options.getUser('mention');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setColor(interaction.member.accentColor || 0x2f3136) // fallback to Discord embed bg gray if something goes wrong
      .addFields({ name: 'Link', value: `[Open File](${link})`, inline: false })
      .setFooter({ text: `Filed by ${interaction.user.username}` })
      .setTimestamp();

    if (details) {
      embed.setDescription(details);
    }

    if (lastUpdateInput) {
      const formatted = formatDate(lastUpdateInput);
      embed.addFields({ name: 'Last Update', value: formatted || lastUpdateInput, inline: true });
    }

    const content = mention ? `${mention}` : null;
    await interaction.reply({ content, embeds: [embed] });
  }
};
