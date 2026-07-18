import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function AdminLayout({ children }) {
  const session = await getSession()
  if (!session?.authenticated || session.role !== 'superadmin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {children}
    </div>
  )
}
