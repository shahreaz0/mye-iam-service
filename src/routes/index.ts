import express from "express"

import sessionRoutes from "./session.route"
import userRoutes from "./user.route"
import roleRoutes from "./role.route"

const rootRouter = express.Router()

rootRouter.get("/healthcheck", (_, res) => {
  res.send({ message: "OK" })
})

rootRouter.get("/version", (_, res) => {
  res.send({ version: process.env.VERSION || process.env.npm_package_version })
})

rootRouter.get("/", (_, res) => {
  res.send({ message: "MYE IAM Service" })
})

rootRouter.use("/sessions", sessionRoutes)
rootRouter.use("/users", userRoutes)
rootRouter.use("/roles", roleRoutes)

export default rootRouter
