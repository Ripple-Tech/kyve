"use client"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { CheckIcon } from "lucide-react"

export const PaymentSuccessModal = () => {
  const router = useRouter()

  const handleClose = () => {
    router.push("/dashboard")
  }

  return (

      <div className="flex flex-col items-center md:px-20 md:py-4 lg:px-40 lg:py-4 p-10">
        <div className="relative aspect-video border  border-gray-200 w-full overflow-hidden rounded-lg bg-gray-50">
          <img
            src="/brand-asset-heart.png"
            className="h-full w-full object-cover"
            alt="Payment success"
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <p className="text-lg/7 tracking-tight font-medium text-pretty">
            Payment successful! 🎉
          </p>
          <p className="text-gray-600 text-sm/6 text-pretty">
            Thank you for successfully depositing funds into your Kyve account. 
  Your transaction has been completed.
          </p>
        </div>

        <div className="mt-8 w-full">
          <Button onClick={handleClose} className="h-12 w-full">
            <CheckIcon className="mr-2 size-5" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    
  )
}
