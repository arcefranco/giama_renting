export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles.split(",") || [];

    // Si es admin, siempre pasa
    if (userRoles.includes("1")) {
      return next();
    }

    // Si tiene al menos un rol permitido
    const hasRole = userRoles.some((rol) => allowedRoles.includes(rol));

    if (!hasRole) {
      return res.send({
        status: false,
        message: "Acceso denegado: no tenés los permisos necesarios.",
      });
    }

    next();
  };
};
