import { s3 } from "../helpers/s3Connection.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const uploadImagesToS3 = async (files, folderPath) => {
  if (!Array.isArray(files) || files.length === 0) {
    return { status: false, message: "No se recibieron imágenes para subir." };
  }
  for (const file of files) {
    const key = `${folderPath}/${uuidv4()}_${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: "giama-bucket",
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await s3.send(command);
    } catch (err) {
      console.error("Error al subir imagen:", err);
      return {
        status: false,
        message: `Error al subir la imagen ${file.originalname}`,
      };
    }
  }

  return { status: true, message: "Imágenes subidas correctamente" };
};
