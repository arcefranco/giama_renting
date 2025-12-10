export const toNumber = (val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const n = parseFloat(val.toString().replace(",", "."));
  return isNaN(n) ? null : n;
};
