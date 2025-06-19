const chrono = require('chrono-node');

/**
 * Preprocesses German phrases into English for chrono-node compatibility.
 * @param {string} input
 * @returns {string}
 */
function preprocessGerman(input) {
  let text = input.toLowerCase().trim();

  // Common date terms
  text = text
    .replace(/\bheute\b/g, 'today')
    .replace(/\bmorgen\b/g, 'tomorrow')
    .replace(/\bgestern\b/g, 'yesterday')
    .replace(/\bvorgestern\b/g, '2 days ago')
    .replace(/\bübermorgen\b/g, 'in 2 days')
    .replace(/\bnächste[rn]? woche\b/g, 'next week')
    .replace(/\bnächste[rn]? monat\b/g, 'next month')
    .replace(/\bnächste[rn]? jahr\b/g, 'next year')
    .replace(/\bnächste[rn]? (montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/g, (match, p1) => {
      const days = {
        montag: 'monday',
        dienstag: 'tuesday',
        mittwoch: 'wednesday',
        donnerstag: 'thursday',
        freitag: 'friday',
        samstag: 'saturday',
        sonntag: 'sunday'
      };
      return `next ${days[p1]}`;
    });

  // Relative time (in X days/weeks/etc)
  text = text.replace(/in (\d+)\s*(tag(e|en)?|woche(n)?|monat(e|en)?|jahr(e|en)?)/g, (match, num, unit) => {
    if (/tag/.test(unit)) return `in ${num} days`;
    if (/woche/.test(unit)) return `in ${num} weeks`;
    if (/monat/.test(unit)) return `in ${num} months`;
    if (/jahr/.test(unit)) return `in ${num} years`;
    return match;
  });

  // Relative time (X days ago)
  text = text.replace(/vor (\d+)\s*(tag(e|en)?|woche(n)?|monat(e|en)?|jahr(e|en)?)/g, (match, num, unit) => {
    if (/tag/.test(unit)) return `${num} days ago`;
    if (/woche/.test(unit)) return `${num} weeks ago`;
    if (/monat/.test(unit)) return `${num} months ago`;
    if (/jahr/.test(unit)) return `${num} years ago`;
    return match;
  });

  return text;
}

/**
 * Parses a user-input date/time string (in EN or DE) into Discord timestamp.
 * Returns <t:unix:D> or null if invalid.
 * @param {string} inputDateStr
 * @returns {string|null}
 */
function parseTimestamp(inputDateStr) {
  if (!inputDateStr) return null;

  const preprocessed = preprocessGerman(inputDateStr);
  const parsedDate = chrono.parseDate(preprocessed, new Date(), { forwardDate: true });

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return null;
  }

  const unixSeconds = Math.floor(parsedDate.getTime() / 1000);
  return `<t:${unixSeconds}:D>`; // Discord date format
}

module.exports = parseTimestamp;
