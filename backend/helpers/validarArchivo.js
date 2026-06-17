import path from "path";

export const validarArchivo = (files, allowedExtensions, allowedMimetypes) => {
  if (!files || (Array.isArray(files) && files.length === 0)) return { valido: true };

  const arrayFiles = Array.isArray(files) ? files : [files];

  for (const file of arrayFiles) {
    if (!file.originalname) continue;
    
    const extension = path.extname(file.originalname).toLowerCase().slice(1);
    const mimetype = file.mimetype ? file.mimetype.toLowerCase() : "";

    if (!allowedExtensions.includes(extension) || !allowedMimetypes.includes(mimetype)) {
      return {
        valido: false,
        message: `El archivo ${file.originalname} no es válido. Extensiones permitidas: ${allowedExtensions.join(", ")}`
      };
    }
  }

  return { valido: true };
};
