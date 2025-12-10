export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles.split(",") || [];
    const flatAllowedRoles = allowedRoles
      .map((r) => r.split(",")) // divido si vino "2,3,4"
      .flat();

    console.log("user roles: ", userRoles);
    console.log("allowed: ", flatAllowedRoles);

    // Si es admin
    if (userRoles.includes("1")) return next();

    // Validar permisos
    const hasRole = userRoles.some((rol) => flatAllowedRoles.includes(rol));

    if (!hasRole) {
      return res.send({
        status: false,
        message: "Acceso denegado: no tenés los permisos necesarios.",
      });
    }

    next();
  };
};

export const authorizeAdmin = () => {
  return (req, res, next) => {
    console.log("acá");
    const userRoles = req.user?.roles.split(",") || [];
    console.log(userRoles);
    // Si es admin, siempre pasa
    if (userRoles.includes("1")) {
      return next();
    } else {
      return res.send({
        status: false,
        message: "Acceso denegado: no tenés los permisos necesarios.",
      });
    }
  };
};
