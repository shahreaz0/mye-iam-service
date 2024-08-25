import crypto from "crypto"
import createHttpError from "http-errors"

import Session from "supertokens-node/recipe/session"
import EmailPassword from "supertokens-node/recipe/emailpassword"
import ThirdParty from "supertokens-node/recipe/thirdparty"

import Dashboard from "supertokens-node/recipe/dashboard"
import EmailVerification from "supertokens-node/recipe/emailverification"
import UserMetadata from "supertokens-node/recipe/usermetadata"
import UserRoles, {
  UserRoleClaim,
  PermissionClaim,
} from "supertokens-node/recipe/userroles"

import AccountLinking from "supertokens-node/recipe/accountlinking"
// model
import UserInfo from "../models/user-info.model"

import type { TypeInput } from "supertokens-node/types"

export function getApiDomain() {
  // `https://sandbox-api.evidentbd.com`
  // "http://localhost:8000"
  const apiUrl = process.env.BE_URL || "https://sandbox-api.evidentbd.com"
  return apiUrl
}

export function getWebsiteDomain() {
  const websiteUrl = process.env.FE_URL || "http://localhost:3000"
  return websiteUrl
}

export const SuperTokensConfig: TypeInput = {
  framework: "express",
  supertokens: {
    connectionURI: process.env.ST_CONNECTION_URI,
    apiKey: process.env.ST_API_KEY,
  },
  appInfo: {
    appName: "MYE IAM Service",
    apiDomain: getApiDomain(),
    websiteDomain: getWebsiteDomain(),
    apiBasePath: "/iam-server/auth",
  },
  recipeList: [
    EmailPassword.init({
      signUpFeature: {
        formFields: [
          {
            id: "user_type",
            validate: async (value) => {
              if (!["parent", "child"].includes(value)) {
                return "Only parent and child value is allowed"
              }
              return undefined
            },
          },
          {
            id: "first_name",
            validate: async (value) => {
              if (value > 100) {
                return "First name must contain at most 100 character(s)"
              }

              return undefined
            },
          },
          {
            id: "last_name",
            validate: async (value) => {
              if (value > 100) {
                return "First name must contain at most 100 character(s)"
              }
              return undefined
            },
          },
          {
            id: "avatar",
            optional: true,
          },
          {
            id: "phone_number",
          },
          {
            id: "country_code",
          },
          {
            id: "timezone",
          },
          {
            id: "company_uuid",
            optional: true,
          },
          {
            id: "company_name",
            optional: true,
          },
          {
            id: "company_address",
            optional: true,
          },
          {
            id: "postcode",
            optional: true,
          },
          {
            id: "role",
            validate: async (value) => {
              if (!["on", "cs", "sm"].includes(value)) {
                return "Not valid"
              }
              return undefined
            },
          },
        ],
      },
      override: {
        functions: (originalImplementation) => {
          return {
            ...originalImplementation,

            signIn: async (input) => {
              const response = await originalImplementation.signIn(input)

              if (response.status === "OK") {
                await UserMetadata.updateUserMetadata(response.user.id, {
                  last_login_datetime: new Date().toISOString(),
                })

                await UserInfo.updateOne(
                  { id: response.user.id },
                  { $set: { last_login_datetime: new Date().toISOString() } }
                )
              }

              return response
            },
          }
        },
        apis: (originalImplementation) => {
          return {
            ...originalImplementation,
            signUpPOST: async (input) => {
              const fields: Record<string, string> = {}

              input.formFields.forEach(
                (field) => (fields[field.id] = field.value)
              )

              // role and permission set in the sessions
              const roles: string[] = (await UserRoles.getAllRoles()).roles

              if (!roles.includes(fields.role)) {
                throw createHttpError.NotFound("No role found")
              }

              const permissionResponse = await UserRoles.getPermissionsForRole(
                fields.role
              )

              if (permissionResponse.status === "UNKNOWN_ROLE_ERROR") {
                throw createHttpError.NotFound("No permission found")
              }

              if (fields.user_type === "child" && !fields.company_uuid) {
                throw createHttpError.BadRequest(
                  "You must provide parent company uuid"
                )
              }

              if (fields.user_type === "child" && fields.role === "on") {
                throw createHttpError.BadRequest(
                  "Child user cannot have this role"
                )
              }

              if (fields.user_type === "parent" && fields.role !== "on") {
                throw createHttpError.BadRequest(
                  "Only 'on' is allowed to parent user"
                )
              }

              // set company uuid if not given
              fields.company_uuid =
                fields.company_uuid !== ""
                  ? fields.company_uuid
                  : crypto.randomUUID()

              // set avatar if not given
              const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${fields.first_name} ${fields.last_name}`

              fields.avatar = fields.avatar ? fields.avatar : avatarUrl

              const response = await originalImplementation.signUpPOST?.(input)

              if (response?.status === "OK") {
                const { id } = response.user

                await UserMetadata.updateUserMetadata(id, fields)

                await UserRoles.addRoleToUser("public", id, fields.role)
                await response.session.fetchAndSetClaim(UserRoleClaim)
                await response.session.fetchAndSetClaim(PermissionClaim)

                response.session.mergeIntoAccessTokenPayload({
                  metadata: {
                    company_uuid: fields.company_uuid,
                    company_name: fields.company_name,
                    email: fields.email,
                    first_name: fields.first_name,
                    last_name: fields.last_name,
                    country_code: fields.country_code,
                    timezone: fields.timezone,
                    last_login_datetime: new Date().toISOString(),
                    avatar: fields.avatar,
                    user_type: fields.user_type,
                  },
                })

                await UserInfo.create({
                  id,
                  ...fields,
                  permissions: permissionResponse.permissions,
                })
              }

              return response as NonNullable<typeof response>
            },
          }
        },
      },
    }),
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [
          {
            config: {
              thirdPartyId: "google",
              clients: [
                {
                  clientId: process.env.GOOGLE_CLIENT_ID,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                },
              ],
            },
          },
        ],
      },
    }),
    Session.init({
      exposeAccessTokenToFrontendInCookieBasedAuth: true,
      override: {
        functions: (originalImplementation) => {
          return {
            ...originalImplementation,
            createNewSession: async (input) => {
              // const sessions = await Session.getAllSessionHandlesForUser(
              //   input.userId
              // )
              // if (sessions.length) {
              //   throw createHttpError(409, "Someone already loggedin", {
              //     userId: input.userId,
              //   })
              // }

              const { metadata } = await UserMetadata.getUserMetadata(
                input.userId
              )

              const response = await originalImplementation.createNewSession({
                ...input,
                accessTokenPayload: {
                  ...input.accessTokenPayload,
                  metadata: {
                    company_uuid: metadata.company_uuid,
                    company_name: metadata.company_name,
                    email: metadata.email,
                    first_name: metadata.first_name,
                    last_name: metadata.last_name,
                    country_code: metadata.country_code,
                    timezone: metadata.timezone,
                    last_login_datetime: metadata.last_login_datetime,
                    avatar: metadata.avatar,
                    user_type: metadata.user_type,
                  },
                },
              })

              return response
            },
          }
        },
      },
    }),
    UserMetadata.init({
      override: {
        functions: (originalImplementation) => {
          return {
            ...originalImplementation,
            updateUserMetadata: async (input) => {
              const response = await originalImplementation.updateUserMetadata(
                input
              )

              if (response.status === "OK") {
                await UserInfo.updateOne(
                  { id: input.userId },
                  input.metadataUpdate
                )
              }

              return response
            },
          }
        },
      },
    }),
    AccountLinking.init({
      override: {
        functions: (om) => {
          return {
            ...om,
            deleteUser: async (input) => {
              const response = await om.deleteUser(input)

              if (response.status === "OK") {
                await UserInfo.deleteOne({ id: input.userId })
              }

              return response
            },
          }
        },
      },
    }),
    EmailVerification.init({
      mode: "REQUIRED",
    }),
    Dashboard.init(),
    UserRoles.init({
      override: {
        functions: (om) => {
          return {
            ...om,
            addRoleToUser: async (input) => {
              const response = await om.addRoleToUser(input)

              await UserInfo.updateOne(
                { id: input.userId },
                {
                  $set: {
                    role: input.role,
                  },
                }
              )

              return response
            },

            removeUserRole: async (input) => {
              const response = await om.removeUserRole(input)

              await UserInfo.updateOne(
                { id: input.userId },
                {
                  $set: {
                    role: "",
                  },
                }
              )

              return response
            },

            createNewRoleOrAddPermissions: async (input) => {
              const response = await om.createNewRoleOrAddPermissions(input)

              await UserInfo.updateMany(
                { role: input.role },
                {
                  $addToSet: {
                    permissions: input.permissions,
                  },
                }
              )

              return response
            },

            removePermissionsFromRole: async (input) => {
              const response = await om.removePermissionsFromRole(input)

              await UserInfo.updateMany(
                { role: input.role },
                {
                  $pullAll: {
                    permissions: input.permissions,
                  },
                }
              )

              return response
            },
          }
        },
      },
    }),
  ],
}
