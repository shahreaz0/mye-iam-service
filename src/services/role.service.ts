import UserRoles from "supertokens-node/recipe/userroles"

import type { UserPermissions, UserRole } from "../schemas/role.schema"

export function createRole(role: UserRole, permissions: UserPermissions) {
  return UserRoles.createNewRoleOrAddPermissions(role, permissions)
}

export function getAllRoles() {
  return UserRoles.getAllRoles()
}

export async function deleteRole(role: UserRole) {
  return UserRoles.deleteRole(role)
}

export function getPermissionsForRole(role: UserRole) {
  return UserRoles.getPermissionsForRole(role)
}

export async function assignRoleToUser(userId: string, role: UserRole) {
  return UserRoles.addRoleToUser("public", userId, role)
}

export async function removeUserRole(userId: string, role: UserRole) {
  return UserRoles.removeUserRole("public", userId, role)
}
