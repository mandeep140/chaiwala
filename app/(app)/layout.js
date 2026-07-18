import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
