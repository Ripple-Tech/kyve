"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem, SelectLabel } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { FormError } from "@/components/forms/form-error";
import { FormSuccess } from "@/components/forms/form-success";

import { createEscrowAction } from "@/actions/create-escrow";

// Schema
const FormSchema = z.object({
  role: z.enum(["buyer", "seller"], { message: "Select a role" }),
  category: z.string().min(1, "Select a category"),
  logistics: z.enum(["no", "pickup", "delivery"], {
    message: "Select a logistics option",
  }),
  amount: z
    .string()
    .min(1, "Enter amount")
    .refine(
      (v) => !Number.isNaN(Number(v.replaceAll(",", ""))) && Number(v.replaceAll(",", "")) > 0,
      {
        message: "Enter a valid amount",
      }
    ),
  currency: z.enum(["NGN", "USD", "GHS"]),
});

type FormValues = z.infer<typeof FormSchema>;

export default function HeroForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      role: "buyer",
      category: "",
      logistics: "no",
      amount: "",
      currency: "NGN",
    },
    mode: "onChange",
  });

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const res = await createEscrowAction(values);

        if (res?.success) {
          setSuccess("Escrow created successfully!");
          form.reset();
        } else {
          setError("Failed to create escrow.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong.");
      }
    });
  };

  // Helper to format amount nicely as user types
  const formatAmount = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    if (!cleaned) return "";
    const parts = cleaned.split(".");
    parts[0] = Number(parts[0]).toLocaleString();
    return parts.filter(Boolean).join(".");
  };

  return (
    <Card className="mx-auto w-full max-w-xl rounded-2xl border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-extrabold text-amber-500 md:text-3xl">
          Escrow Calculator
        </CardTitle>
        <Separator className="mx-auto w-24 bg-black/10" />
        <CardDescription className="text-balance px-4 text-sm text-muted-foreground">
          <span className="font-bold text-base text-golden-dark">
            Afraid of losing your money to a stranger on the <br />
            internet?
          </span>
          <br />
          <span className="font-bold text-[20px] text-gray-700">
            Guess what? Kyve Got your Back!
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Role + Category */}
            <div className="grid grid-cols-2 gap-0">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 w-full rounded-none border-r-0">
                          <SelectValue placeholder="Buyers" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Role</SelectLabel>
                          <SelectItem value="buyer">Buyer</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 w-full rounded-none border-l-0">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Category</SelectLabel>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="automobile">Automobile</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Logistics */}
            <FormField
              control={form.control}
              name="logistics"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="sr-only">Logistics</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 w-full rounded-none">
                        <SelectValue placeholder="Do you Require Logistics or Delivery Guy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Logistics</SelectLabel>
                        <SelectItem value="no">No Logistics Needed</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Row */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <div className="flex h-12 items-center justify-center rounded-none border bg-muted/40 px-4 text-sm font-medium">
                For ₦
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="col-auto w-full">
                    <FormLabel className="sr-only">Amount</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="Enter Amount"
                        className="h-12 w-full rounded-none"
                        value={field.value}
                        onChange={(e) => field.onChange(formatAmount(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription className="sr-only">Amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="h-12 min-w-[88px] rounded-none">
                          <SelectValue placeholder="NGN" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent align="end">
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GHS">GHS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-none bg-black text-base font-semibold text-amber-700 hover:bg-black/90"
            >
              {isPending ? "Creating Escrow..." : "Transact Now"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}