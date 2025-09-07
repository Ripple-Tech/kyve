import { db } from "@/lib/db"
import getCurrentUser from "@/actions/getCurrentUser"

export async function createTRPCContext() {
  const user = await getCurrentUser()
  return {
    db,
    user, // user can be null | { id: string, ... }
  }
}