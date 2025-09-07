"use client"

import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@/server/routers"
import superjson from "superjson"
import { httpBatchLink } from "@trpc/client"

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== "undefined") return ""
  if (process.env.NEXT_PUBLIC_APP_URL) return `https://${process.env.NEXT_PUBLIC_APP_URL}`
  return "http://localhost:3000"
}

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson, // moved here (not at root)
      }),
    ],
  })
}