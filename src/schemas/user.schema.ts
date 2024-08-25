import { z } from "zod"

export const getAllUsersSchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    fields: z
      .string()
      .regex(/^\w+(,\w+)*$/, "'fields' must be comma separated value"),
    company_uuid: z.string().optional(),
    sort: z.string().optional(),
  }),
})

export type GetAllUsers = z.infer<typeof getAllUsersSchema>
