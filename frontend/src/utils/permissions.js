export const isAuthValid = (authUser) => {
  if (!authUser) return false;

  if (!authUser.expert) return false;

  if (!authUser.expiresAt) return false;

  return Date.now() < authUser.expiresAt;
};

export const hasPermission = (authUser, permissionKey) => {
  if (!isAuthValid(authUser)) return false;

  const permissions = authUser.expert?.permissions;

  if (!permissions) return false;

  return permissions[permissionKey] === true;
};