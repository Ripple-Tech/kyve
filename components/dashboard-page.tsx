"use client"

import { ReactNode, useState } from "react"
import { Button } from "./ui/button"
import { ArrowLeft } from "lucide-react"
import { Heading } from "./heading"
import { useRouter } from "next/navigation"
import { Modal } from "./ui/modal"
import HeroForm from "./heroform"

interface DashboardPageProps {
  title: string
  children?: ReactNode
  hideBackButton?: boolean
  showCreate?: boolean
  cta?: ReactNode
}

export const DashboardPage = ({
  title,
  children,
  cta,
  hideBackButton,
  showCreate = false,
}: DashboardPageProps) => {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <section className="flex-1 h-full w-full flex flex-col">
      {/* HEADER */}
      <div className="w-full p-6 sm:p-8 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
          {!hideBackButton && (
            <Button
              onClick={() => router.replace("/dashboard")}
              className="w-fit bg-white"
              variant="outline"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}

          <Heading>{title}</Heading>
        </div>

        <div className="flex items-center gap-3">
          {cta}
          {showCreate && (
            <Button
              size="sm"
              className="bg-primary text-white hover:bg-amber-800"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Escrow
            </Button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 mt-10">{children}</div>

      {/* CREATE ESCROW MODAL */}
      <Modal
        showModal={showCreateModal}
        setShowModal={() => setShowCreateModal(false)}
        className="max-w-2xl p-8"
      >
        <h2 className="text-lg font-semibold mb-4">Create Escrow</h2>
        <HeroForm inDashboard onSuccess={() => setShowCreateModal(false)} />
      </Modal>
    </section>
  )
}
