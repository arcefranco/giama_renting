export const validacionCUIT = (string) => {
  const principio = [20, 23, 24, 27, 30, 33, 34];

  // validar prefijo
  if (!principio.includes(parseInt(string.slice(0, 2), 10))) {
    return false;
  }

  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 1];
  let suma = 0;

  for (let i = 0; i < multiplicadores.length; i++) {
    suma += parseInt(string[i], 10) * multiplicadores[i];
  }
  return suma % 11 === 0;
};