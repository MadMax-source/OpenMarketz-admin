import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginForm } from "@/components/admin/login-form"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
