import { z } from "zod"

export const EscrowFormSchema = z.object({
  role: z.enum(["buyer", "seller"], { message: "Select a role" }),
  category: z.string().min(1, "Select a category"),
  logistics: z.enum(["no", "pickup", "delivery"], {
    message: "Select a logistics option",
  }),
  amount: z
    .string()
    .min(1, "Enter amount")
    .refine(
      (v) =>
        !Number.isNaN(Number(v.replaceAll(",", ""))) &&
        Number(v.replaceAll(",", "")) > 0,
      { message: "Enter a valid amount" }
    ),
  currency: z.enum(["NGN", "USD", "GHS"]),
})

export type EscrowFormValues = z.infer<typeof EscrowFormSchema>