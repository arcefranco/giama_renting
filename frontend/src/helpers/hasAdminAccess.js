  export const hasAdminAccess = (roles) => {
    // roles viene como string: "2,4"
    const userRoles = roles ? roles.split(",") : [];
    if (userRoles.includes("1")) return true;
  };