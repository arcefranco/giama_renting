import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.send({ status: false, message: "No autorizado: falta token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.send({ status: false, message: "Token inválido o expirado." });
  }
};
