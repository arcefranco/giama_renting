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
  console.log(suma % 11 === 0);
  return suma % 11 === 0;
};

/**
 * Dim inicio As Integer = CInt(numero.Substring(0, 2))
                    Dim execto As Integer() = New Integer() {20, 23, 24, 27, 30, 33, 34}
                    If Array.IndexOf(execto, inicio) < 0 Then Return False
                    iSuma += CInt(numero.Substring(0, 1)) * 5
                    iSuma += CInt(numero.Substring(1, 1)) * 4
                    iSuma += CInt(numero.Substring(2, 1)) * 3
                    iSuma += CInt(numero.Substring(3, 1)) * 2
                    iSuma += CInt(numero.Substring(4, 1)) * 7
                    iSuma += CInt(numero.Substring(5, 1)) * 6
                    iSuma += CInt(numero.Substring(6, 1)) * 5
                    iSuma += CInt(numero.Substring(7, 1)) * 4
                    iSuma += CInt(numero.Substring(8, 1)) * 3
                    iSuma += CInt(numero.Substring(9, 1)) * 2
                    iSuma += CInt(numero.Substring(10, 1)) * 1
                End If

                If Math.Round(iSuma / 11, 0) = (iSuma / 11) Then
                    bValidado = True
                End If
 */
