import mongoose, { Error } from "mongoose"
import log from "../utils/logger"

export default async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
  } catch (error) {
    if (error instanceof Error) log.error(error.message)
  }
}

mongoose.connection.on("connected", () => {
  log.info("DB connected!")
})

mongoose.connection.on("error", (error) => {
  log.error(error.message)
})

mongoose.connection.on("disconnected", () => {
  log.info("DB connection is disconnected")
})

process.on("SIGINT", async () => {
  await mongoose.connection.close()
  process.exit(0)
})
