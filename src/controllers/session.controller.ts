import { Request, Response, NextFunction } from "express"

import Session from "supertokens-node/recipe/session"
import Multitenancy from "supertokens-node/recipe/multitenancy"
import log from "../utils/logger"

import type { SessionRequest } from "supertokens-node/framework/express"

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function getAllSessionsForUser(req: Request, res: Response) {
  const sessions = await Session.getAllSessionHandlesForUser(req.params.userId)

  res.send(sessions)
}

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function getSessions(req: SessionRequest, res: Response) {
  const session = req.session

  res.send({
    sessionHandle: session?.getHandle(),
    userId: session?.getUserId(),
    accessTokenPayload: session?.getAccessTokenPayload(),
  })
}

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function getAllTanents(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenants = await Multitenancy.listAllTenants()
    res.send(tenants)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function revokeAllSessionsOfAUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await Session.revokeAllSessionsForUser(req.params.userId)
    res.send({ message: "Success! All user sessions have been revoked" })
  } catch (error) {
    log.error(error)
    next(error)
  }
}
