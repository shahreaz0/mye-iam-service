import { Request, Response, NextFunction } from "express"
import createHttpError from "http-errors"

import {
  UserRoleClaim,
  PermissionClaim,
} from "supertokens-node/recipe/userroles"
import type { SessionRequest } from "supertokens-node/framework/express"
import UserMetadata from "supertokens-node/recipe/usermetadata"

import log from "../utils/logger"
import * as roleServices from "../services/role.service"

import type {
  CreateRole,
  PermissionsForRole,
  UserRole,
} from "../schemas/role.schema"
import UserInfo from "../models/user-info.model"

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function getAllRolesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usersResponse = await roleServices.getAllRoles()

    return res.json(usersResponse)
  } catch (error) {
    log.error(error)
    next()
  }
}

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function getPermissionsForRoleHandler(
  req: Request<PermissionsForRole["params"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const response = await roleServices.getPermissionsForRole(req.params.role)

    if (response.status === "UNKNOWN_ROLE_ERROR") {
      throw createHttpError.NotFound("No such role exists")
    }

    return res.json(response.permissions)
  } catch (error) {
    log.error(error)
    next()
  }
}

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function createRoleHandler(
  req: Request<object, object, CreateRole["body"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const roles = await roleServices.createRole(
      req.body.role,
      req.body.permissions
    )

    if (roles.createdNewRole === false) {
      createHttpError.Conflict("The role already exists")
    }

    return res.json(roles)
  } catch (error) {
    log.error(error)
    next()
  }
}

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function assignRoleToUserHandler(
  req: SessionRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { metadata } = await UserMetadata.getUserMetadata(
      req.body.child_user_id
    )

    if (metadata.role === req.body.role) {
      throw createHttpError.BadRequest("User already have this role")
    }

    if (!req.session) throw createHttpError.BadRequest("No sessions")

    if (!Object.keys(metadata).length) {
      throw createHttpError.NotFound("No child user found")
    }

    if (
      metadata.company_uuid !== req.session.getAccessTokenPayload().company_uuid
    ) {
      throw createHttpError.Unauthorized()
    }

    if (metadata.user_type === "parent") {
      throw createHttpError.Unauthorized()
    }

    const childUserId = req.body.child_user_id

    await roleServices.removeUserRole(childUserId, metadata.role)

    const result = await roleServices.assignRoleToUser(
      childUserId,
      req.body.role
    )

    await UserMetadata.updateUserMetadata(childUserId, {
      role: req.body.role,
    })

    await UserInfo.updateOne(
      { id: childUserId },
      { $set: { role: req.body.role } }
    )

    await req.session.fetchAndSetClaim(UserRoleClaim)
    await req.session.fetchAndSetClaim(PermissionClaim)

    return res.json(result)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function deleteRoleHandler(
  req: Request<{ role: UserRole }>,
  res: Response,
  next: NextFunction
) {
  try {
    const response = await roleServices.deleteRole(req.params.role)

    if (!response.didRoleExist) {
      throw createHttpError.NotFound()
    }

    res.send(response)
  } catch (error) {
    next(error)
  }
}
