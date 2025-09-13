"use client"

import { useTransition, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  amount: z
    .number({ error: "Enter a valid number" })
    .min(100, "Minimum deposit is ₦100")
    .max(1_000_000, "Maximum deposit is ₦1,000,000"),
})

type Values = z.infer<typeof schema>

export function DepositForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0 },
  })

  const onSubmit = (values: Values) => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.message ?? "Deposit init failed")
          return
        }
        onSuccess()
        // Redirect to Opay payment page
        window.location.href = data.paymentUrl
      } catch {
        setError("Unexpected error, please try again")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₦)</FormLabel>
              <Input
                type="number"
                placeholder="1000"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Processing…" : "Proceed"}
        </Button>
      </form>
    </Form>
  )
}