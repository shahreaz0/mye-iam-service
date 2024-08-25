import { Request, Response, NextFunction } from "express"

import UserMetadata from "supertokens-node/recipe/usermetadata"
import type { SessionRequest } from "supertokens-node/framework/express"
import log from "../utils/logger"
import UserInfo from "../models/user-info.model"
import { GetAllUsers } from "../schemas/user.schema"

import { deleteUser } from "supertokens-node"

/**
 * @route   METHOD /route
 * @desc    description
 * @access  accessibility
 */
export async function getUserInfo(
  req: SessionRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.session?.getUserId()

    if (!userId) return res.send({ message: "No userId" })

    const { metadata } = await UserMetadata.getUserMetadata(userId)
    return res.json({ id: userId, ...metadata })
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
export async function getAllUsers(
  req: Request<object, object, object, GetAllUsers["query"]>,
  res: Response,
  next: NextFunction
) {
  try {
    let query = UserInfo.find()

    // field selection
    // if (req.query.fields) {
    //   const params = req.query.fields.split(",").join(" ")

    //   query = query.select(`-_id ${params}`)
    // }

    // limit
    if (req.query.limit) query = query.limit(+req.query.limit)

    // // sort
    // if (req.query.sort) {
    //   const [field, order] = req.query.sort.split(":")
    //   query = query.sort({ [field]: order })
    // }

    if (req.query.company_uuid) {
      query = query.find({ company_uuid: req.query.company_uuid })
    }

    const users = await query.find().select("-_id")

    return res.json({ status: "Success", users })
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
export async function updatePaymentSessionId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userInfo = await UserInfo.updateOne(
      { id: req.params.userId },
      { $set: { payment_session_id: req.body.payment_session_id } },
      { new: true }
    )

    return res.json({ status: "Success", userInfo: userInfo })
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
export async function deleteChildUser(
  req: SessionRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.params.id
    const result = await deleteUser(userId)
    return res.json({ status: "Success", data: result })
  } catch (error) {
    log.error(error)
    next(error)
  }
}
