"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

interface ActivateMembershipDialogProps {
  userId: string
}

export function ActivateMembershipDialog({ userId }: ActivateMembershipDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleActivateMembership = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("profiles").update({ is_member: true }).eq("id", userId)

      if (error) {
        console.error("Error activating membership:", error)
        toast({
          title: "Error activating membership",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Membership Activated",
        description: "The user's membership has been successfully activated.",
      })
      setOpen(false)
    } catch (error) {
      console.error("Unexpected error activating membership:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Activate Membership</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Membership?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to activate this user's membership? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleActivateMembership}>
            {isLoading ? "Activating..." : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
