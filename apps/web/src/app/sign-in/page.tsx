import Image from "next/image"
import { SignInForm } from "@/components/signin-form"

export default function SignInPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Image src="/logo.png" alt="logo" width={24} height={24} />
          </div>
          Tradingflow App
        </a>
        <SignInForm />
      </div>
    </div>
  )
}
