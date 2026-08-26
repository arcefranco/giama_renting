function validarCuit(cuit) {
  if (cuit.length !== 11) return false;
  const aMult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cuit[i]) * aMult[i];
  }
  let resto = sum % 11;
  let digito = resto === 0 ? 0 : resto === 1 ? (cuit.startsWith('20') ? 9 : (cuit.startsWith('27') ? 4 : 9)) : 11 - resto;
  console.log("Calculated digit:", digito, "Provided digit:", cuit[10], "Remainder:", resto);
  return digito === parseInt(cuit[10]);
}
validarCuit("20396311425");
