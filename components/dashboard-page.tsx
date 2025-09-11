"use client"

import { ReactNode, useState } from "react"
import { Button } from "./ui/button"
import { ArrowLeft, Plus } from "lucide-react"
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
    <section className="flex-1 h-full w-full flex flex-col mb-20">
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
            <>
            <Button
              size="sm"
              className="hidden md:block bg-primary text-white hover:bg-amber-800"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Escrow
            </Button>

         {/* Mobile floating button */}
<button
          className="flex md:hidden fixed bottom-20 right-8 z-20 items-center justify-center h-16 w-16 rounded-full bg-primary text-white shadow-lg hover:bg-amber-700 transition-colors duration-200"
          onClick={() => setShowCreateModal(!showCreateModal)}
        >
          {/*
            The Plus icon from lucid-react.
            We apply the 'h-12' and 'w-12' classes directly to the icon component.
            These classes are used to increase the icon's size.
          */}
          <Plus className="h-12 w-12" />
        </button>

          </>
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
