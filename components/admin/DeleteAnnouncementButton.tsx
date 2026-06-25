'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!confirm('Delete this announcement? Agents will no longer see it.')) return
    setBusy(true)
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) router.refresh()
    else alert('Could not delete.')
  }

  return (
    <button onClick={remove} disabled={busy} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  )
}
