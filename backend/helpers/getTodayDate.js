export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Mes empieza en 0
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYesterdayDate = () => {
  const today = new Date();
  today.setDate(today.getDate() - 1); // restar un día
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Mes empieza en 0
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
