import { AnyZodObject, ZodError } from "zod"
import type { Request, Response, NextFunction } from "express"
import createHttpError from "http-errors"
import log from "../utils/logger"

const validateResource =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        log.error(error.message)

        next(
          createHttpError(400, error.issues[0].message, {
            path: error.issues[0].path,
          })
        )
      }
    }
  }

export default validateResource
