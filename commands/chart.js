require('dotenv').config();
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType } = require('discord.js');
const fetch = require('node-fetch');

const CHART_TYPES = [
  { name: 'Verkäufe über Zeit', value: 'sales-over-time' },
  { name: 'Verkäufe pro Klasse', value: 'sales-per-class' },
  { name: 'Eintritte nach Uhrzeit', value: 'entered-over-time' },
  { name: 'Verkäufe pro Benutzer', value: 'sales-per-user' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chart')
    .setDescription('Zeigt ein Statistik-Diagramm als Bild')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Diagramm-Typ')
        .setRequired(true)
        .addChoices(...CHART_TYPES.map(t => ({ name: t.name, value: t.value })))
    ),

  async execute(interaction) {
    // Show modal to ask for username and password
    const type = interaction.options.getString('type');
    const modal = new ModalBuilder()
      .setCustomId(`chart-modal-${type}`)
      .setTitle('Authentifizierung erforderlich')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('username')
            .setLabel('Benutzername')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Passwort')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
  },

  // This handler should be registered in your main bot file to handle modal submissions
  async handleModalSubmit(interaction) {
    if (
      interaction.type !== InteractionType.ModalSubmit ||
      !interaction.customId.startsWith('chart-modal-')
    ) return;

    const type = interaction.customId.replace('chart-modal-', '');
    const username = interaction.fields.getTextInputValue('username');
    const password = interaction.fields.getTextInputValue('password');
    const url = `http://localhost:4000/api/stats/chart/${type}/image`;

    try {
      // The backend should verify:
      // 1. Authorization: Bearer <bot token> (process.env.DISCORD_BOT_TOKEN)
      // 2. X-Username and X-Password for user credentials
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}`, // Bot authentication
          'X-Username': username, // User authentication
          'X-Password': password  // User authentication
        }
      });
      if (!response.ok) {
        return await interaction.reply({ content: 'Fehler beim Abrufen des Diagramms.', ephemeral: true });
      }
      const buffer = await response.buffer();
      await interaction.reply({
        files: [{ attachment: buffer, name: `${type}.png` }]
      });
    } catch (err) {
      await interaction.reply({ content: 'Fehler beim Abrufen des Diagramms.', ephemeral: true });
    }
  }
};
