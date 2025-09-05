import { handlers } from "@/lib/auth"

// Force dynamic rendering for NextAuth routes
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers
