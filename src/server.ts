import express, { ErrorRequestHandler } from "express"
import "dotenv/config"

import compression from "compression"
import cors from "cors"
import helmet from "helmet"
import CreateHttpError from "http-errors"
import morgan from "morgan"
import { z } from "zod"

import supertokens from "supertokens-node"
import { middleware, errorHandler } from "supertokens-node/framework/express"
import { getWebsiteDomain, SuperTokensConfig } from "./configs/supertokens"

import rootRouter from "./routes"
import log from "./utils/logger"

import connectMongo from "./configs/db"
connectMongo()

// setup env
const envVars = z.object({
  MONGO_URI: z.string(),
  ST_CONNECTION_URI: z.string(),
  ST_API_KEY: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  VERSION: z.string().optional(),
})

envVars.parse(process.env)

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVars> {}
  }
}

supertokens.init(SuperTokensConfig)

const app = express()
app.use(express.json())
app.use(morgan("tiny"))
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
)
app.use(compression())
app.use(
  cors({
    origin: [
      getWebsiteDomain(),
      "https://sandbox.inventorykeeper.net",
      "https://inventorykeeper.net",
      "https://www.inventorykeeper.net",
    ],
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
  })
)

app.disable("x-powered-by")

app.use(middleware())

app.use("/iam-server", rootRouter)

// error handler
app.use(errorHandler())

app.use((_req, _res, next) => {
  next(CreateHttpError.NotFound())
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(((err, _req, res, _next) => {
  res.status(err.status || 500)

  res.send({
    ...err,
    status: err.status || 500,
    message: err.message,
    ...(err.path && { path: err.path }),
  })
}) as ErrorRequestHandler)

// server
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  log.info(`http://localhost:${PORT}`)
})
