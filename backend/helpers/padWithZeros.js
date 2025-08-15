export const padWithZeros = (str, length) => {
  console.log("Esto es str: ", str);
  return String(str).padStart(length, "0");
};
