"use client"

import { useEffect, useState } from "react"
import {PaymentSuccessModal} from "@/components/payment-success-modal"

const Page = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Open the success modal on component mount
    setIsModalOpen(true)
  }, [])

  return (
    <div>
      {isModalOpen && <PaymentSuccessModal />}
      {/* Other page content can go here */}
    </div>
  )
}

export default Page