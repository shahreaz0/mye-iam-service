import { z } from "zod"

export const roleSchema = z.enum(["on", "cs", "sm"])
export const roleSchemaWithoutOwner = z.enum(["cs", "sm"])

export const permissionsSchema = z
  .enum(["*", "inventory:read", "inventory:write", "order:read", "order:write"])
  .array()

export const createRoleSchema = z.object({
  body: z.object({
    role: roleSchema,
    permissions: permissionsSchema,
  }),
})

export const assignRoleToUsersSchema = z.object({
  body: z.object({
    role: roleSchemaWithoutOwner,
    child_user_id: z.string(),
  }),
})

export const getPermissionsForRoleSchema = z.object({
  params: z.object({
    role: roleSchema,
  }),
})

export type UserRole = z.infer<typeof roleSchema>
export type UserPermissions = z.infer<typeof permissionsSchema>
export type CreateRole = z.infer<typeof createRoleSchema>
export type AssignRoleToUser = z.infer<typeof assignRoleToUsersSchema>
export type PermissionsForRole = z.infer<typeof getPermissionsForRoleSchema>
