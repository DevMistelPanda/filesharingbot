module.exports = function formatDate(dateStr) {
    let date;
    try {
      date = new Date(dateStr);
      if (isNaN(date)) throw new Error();
    } catch {
      return null;
    }
  
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
  
    return isToday
      ? `Today, ${date.getHours()}h`
      : `${date.toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}, ${date.getHours()}h`;
  };
  