const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const parseTimestamp = require('../utils/parseTimestamp');

/**
 * Light check for valid-looking URLs
 */
function isValidUrl(link) {
  try {
    const url = new URL(link.startsWith('http') ? link : `https://${link}`);
    return !!url.hostname;
  } catch (e) {
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sharefile')
    .setDescription('Share a file with metadata')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('The link to your file (e.g. test.com)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('title')
        .setDescription('The title of the file')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('details')
        .setDescription('Optional details')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('lastupdate')
        .setDescription('Last update date/time (optional)')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('mention')
        .setDescription('Tag a user who should see this')),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const rawLink = interaction.options.getString('link');
    const details = interaction.options.getString('details');
    const lastUpdateInput = interaction.options.getString('lastupdate');
    const mention = interaction.options.getUser('mention');

    // Normalize and validate link
    const link = rawLink.startsWith('http://') || rawLink.startsWith('https://')
      ? rawLink
      : `https://${rawLink}`;

    if (!isValidUrl(link)) {
      return await interaction.reply({
        content: '❌ The link you entered doesn’t appear to be valid. Try using a full domain like `example.com` or `https://example.com`.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setColor(interaction.member.displayColor || 0x2f3136)
      .addFields({ name: 'Link', value: `[Open File](${link})`, inline: false })
      .setFooter({ text: `Filed by ${interaction.user.username}` })
      .setTimestamp();

    if (details) {
      embed.setDescription(details);
    }

    if (lastUpdateInput) {
      const formatted = parseTimestamp(lastUpdateInput);
      embed.addFields({
        name: 'Last Update',
        value: formatted || 'Invalid date format',
        inline: true
      });
    }

    const content = mention ? `${mention}` : null;
    await interaction.reply({ content, embeds: [embed] });
  }
};
