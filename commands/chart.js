require('dotenv').config();
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType, EmbedBuilder } = require('discord.js');
// Fix: Use node-fetch v2 syntax for CommonJS (require) environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const CHART_TYPES = [
  { name: 'Verkäufe über Zeit', value: 'sales-over-time' },
  { name: 'Verkäufe pro Klasse', value: 'sales-per-class' },
  { name: 'Eintritte nach Uhrzeit', value: 'entered-over-time' },
  { name: 'Verkäufe pro Benutzer', value: 'sales-per-user' }
];

// Mapping Chart-Type zu Backend-URL und Chart-Konfiguration
const CHART_CONFIGS = {
  'sales-over-time': {
    url: 'http://localhost:3000/api/stats/chart/sales-over-time/bot-data',
    buildConfig: (data) => ({
      type: 'line',
      data: {
        labels: data.map(d => d.date ? d.date.toString().split('T')[0] : ''),
        datasets: [{
          label: 'Tickets verkauft',
          data: data.map(d => d.sold),
          fill: false,
          borderColor: '#7c3aed',
          backgroundColor: '#a78bfa',
          tension: 0.2,
        }]
      },
      options: {
        plugins: { legend: { display: true }, title: { display: false } }
      }
    })
  },
  'sales-per-class': {
    url: 'http://localhost:3000/api/stats/chart/sales-per-class/bot-data',
    buildConfig: (data) => ({
      type: 'bar',
      data: {
        labels: data.map(d => d.class_number),
        datasets: [{
          label: 'Tickets verkauft',
          data: data.map(d => d.sold),
          backgroundColor: '#7c3aed'
        }]
      },
      options: {
        plugins: { legend: { display: false }, title: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Klasse' } },
          y: { title: { display: true, text: 'Tickets verkauft' }, beginAtZero: true }
        }
      }
    })
  },
  'entered-over-time': {
    url: 'http://localhost:3000/api/stats/chart/entered-over-time/bot-data',
    buildConfig: (data) => ({
      type: 'bar',
      data: {
        labels: data.map(d => `${d.hour}:00`),
        datasets: [{
          label: 'Eintritte',
          data: data.map(d => d.entered),
          backgroundColor: '#7c3aed'
        }]
      },
      options: {
        plugins: { legend: { display: false }, title: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Uhrzeit' } },
          y: { title: { display: true, text: 'Eintritte' }, beginAtZero: true }
        }
      }
    })
  },
  'sales-per-user': {
    url: 'http://localhost:3000/api/stats/chart/sales-per-user/bot-data',
    buildConfig: (data) => ({
      type: 'bar',
      data: {
        labels: data.map(d => d.username),
        datasets: [{
          label: 'Tickets verkauft',
          data: data.map(d => d.sold),
          backgroundColor: data.map((_, idx) => idx === 0 ? '#f59e42' : '#6366f1')
        }]
      },
      options: {
        plugins: { legend: { display: false }, title: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Benutzer' } },
          y: { title: { display: true, text: 'Tickets verkauft' }, beginAtZero: true }
        }
      }
    })
  }
};

const CHART_TITLES = {
  'sales-over-time': 'Verkäufe über Zeit',
  'sales-per-class': 'Verkäufe pro Klasse',
  'entered-over-time': 'Eintritte nach Uhrzeit',
  'sales-per-user': 'Verkäufe pro Benutzer'
};

const CHART_DESCRIPTIONS = {
  'sales-over-time': 'Dieses Diagramm zeigt die Anzahl der verkauften Tickets im Zeitverlauf.',
  'sales-per-class': 'Dieses Diagramm zeigt die verkauften Tickets pro Klassenstufe.',
  'entered-over-time': 'Dieses Diagramm zeigt die Eintritte nach Uhrzeit.',
  'sales-per-user': 'Dieses Diagramm zeigt die verkauften Tickets pro Benutzer.'
};

const CHART_LINK = 'https://sb.wintruff.de/login';

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
    // Modal für Username/Passwort anzeigen
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

  async handleModalSubmit(interaction) {
    if (
      interaction.type !== InteractionType.ModalSubmit ||
      !interaction.customId.startsWith('chart-modal-')
    ) return;

    const type = interaction.customId.replace('chart-modal-', '');
    const username = interaction.fields.getTextInputValue('username');
    const password = interaction.fields.getTextInputValue('password');

    const chartInfo = CHART_CONFIGS[type];
    if (!chartInfo) {
      console.log('[DEBUG] Unknown chart type:', type);
      return await interaction.reply({ content: 'Unbekannter Diagramm-Typ.', flags: 64 });
    }

    try {
      // Debug: Bot endpoint request
      console.log('[DEBUG] Fetching bot-data:', {
        url: chartInfo.url,
        headers: {
          Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}`,
          'X-Username': username,
          'X-Password': password
        }
      });
      const statsRes = await fetch(chartInfo.url, {
        headers: {
          Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}`,
          'X-Username': username,
          'X-Password': password
        }
      });
      console.log('[DEBUG] Stats response status:', statsRes.status);
      const statsData = await statsRes.clone().json().catch(() => ({}));
      console.log('[DEBUG] Stats response data:', statsData);

      if (!statsRes.ok) {
        return await interaction.reply({ content: 'Fehler beim Abrufen der Statistikdaten.', flags: 64 });
      }

      // Debug: Chart config
      const width = 900, height = 500;
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
      const chartConfig = chartInfo.buildConfig(statsData);
      console.log('[DEBUG] Chart config:', chartConfig);

      // Debug: Render chart
      const buffer = await chartJSNodeCanvas.renderToBuffer(chartConfig, 'image/png');
      console.log('[DEBUG] Chart image buffer length:', buffer.length);

      // Embed with title, description, link and footer
      const embed = new EmbedBuilder()
        .setTitle(CHART_TITLES[type] || 'Diagramm')
        .setDescription(`${CHART_DESCRIPTIONS[type] || ''}\n[Zur SB-Website](${CHART_LINK})`)
        .setColor(0x7c3aed)
        .setImage(`attachment://${type}.png`)
        .setFooter({ text: 'Bereitgestellt von RGBBot | DevMistelPanda' });

      await interaction.reply({
        embeds: [embed],
        files: [{ attachment: buffer, name: `${type}.png` }]
      });
      console.log('[DEBUG] Chart sent to Discord.');
    } catch (err) {
      console.error('[ERROR] handleModalSubmit:', err);
      await interaction.reply({ content: 'Fehler beim Generieren des Diagramms.', flags: 64 });
    }
  }
};