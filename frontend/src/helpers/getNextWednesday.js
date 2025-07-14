export const getNextWednesday = (fromDate) => {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = (3 - day + 7) % 7; // 3 = miércoles
  if (diff === 0) return date;
  else {
    date.setDate(date.getDate() + diff);
    return date;
  }
};
