import { useState, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

interface UserFormDialogProps {
  onAddUser: (user: {
    name: string
    email: string
    role: string
    plan: string
    billing: string
    status: string
  }) => void
}

export function UserFormDialog({ onAddUser }: UserFormDialogProps) {
  const [open, setOpen] = useState(false)
  const isSubmittingRef = useRef(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
    plan: "",
    billing: "",
    status: "",
  })

  const isDirty = Boolean(
    userData.name.trim() ||
    userData.email.trim() ||
    userData.role ||
    userData.plan ||
    userData.billing ||
    userData.status
  )

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      if (!window.confirm("You have unsaved user changes. Are you sure you want to discard them?")) {
        return
      }
    }
    setOpen(newOpen)
    if (!newOpen) {
      setUserData({
        name: "",
        email: "",
        role: "",
        plan: "",
        billing: "",
        status: "",
      })
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmittingRef.current) return

    if (!userData.name.trim()) {
      toast.error("Please enter a name")
      return
    }
    if (!userData.email.trim() || !userData.email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    isSubmittingRef.current = true
    onAddUser({
      ...userData,
      name: userData.name.trim(),
      email: userData.email.trim(),
    })
    setUserData({
      name: "",
      email: "",
      role: "",
      plan: "",
      billing: "",
      status: "",
    })
    setOpen(false)
    setTimeout(() => {
      isSubmittingRef.current = false
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Enter full name"
              value={userData.name}
              maxLength={50}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={userData.email}
              maxLength={254}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Role
              </label>
              <Select
                value={userData.role}
                onValueChange={(value) => setUserData({ ...userData, role: value })}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Author">Author</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Maintainer">Maintainer</SelectItem>
                  <SelectItem value="Subscriber">Subscriber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Plan
              </label>
              <Select
                value={userData.plan}
                onValueChange={(value) => setUserData({ ...userData, plan: value })}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Billing
              </label>
              <Select
                value={userData.billing}
                onValueChange={(value) => setUserData({ ...userData, billing: value })}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select billing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto Debit">Auto Debit</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Paypal">Paypal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Status
              </label>
              <Select
                value={userData.status}
                onValueChange={(value) => setUserData({ ...userData, status: value })}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer bg-[#649809] hover:bg-[#649809]/90 text-white">
              Save User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
