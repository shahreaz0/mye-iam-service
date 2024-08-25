import { Schema, model } from "mongoose"
import { UserPermissions, UserRole } from "../schemas/role.schema"

export type UserInfo = {
  id: string
  email: string
  password: string
  user_type: string
  role: UserRole
  permissions: UserPermissions
  company_uuid: string
  first_name: string
  last_name: string
  avatar: string
  phone_number: string
  country_code: string
  timezone: string
  company_name: string
  company_address: string
  postcode: string
  last_login_datetime: Date
  payment_session_id: string
}

const userInfoSchema = new Schema<UserInfo>(
  {
    id: String,
    email: {
      type: String,
      trim: true,
    },
    user_type: {
      type: String,
      enum: ["parent", "child"],
    },
    role: {
      type: String,
      enum: ["on", "cs"],
    },
    permissions: {
      type: [String],
    },
    company_uuid: String,
    first_name: String,
    last_name: String,
    avatar: String,
    phone_number: String,
    country_code: String,
    timezone: String,
    company_name: String,
    company_address: String,
    postcode: String,
    last_login_datetime: Date,
    payment_session_id: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
)

const UserInfo = model<UserInfo>("UserInfo", userInfoSchema)

export default UserInfo
