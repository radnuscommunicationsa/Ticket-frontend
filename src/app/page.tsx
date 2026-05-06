'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isLoggedIn } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const user = getUser()
    router.replace(user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')
  }, [router])
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
    <div style={{color:'var(--red-primary)',fontSize:'1rem'}}>Loading...</div>
  </div>
}

