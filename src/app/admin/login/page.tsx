'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginSchema } from '@/lib/validations'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [show, setShow] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async ({ email, password }: LoginSchema) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error('Email ou senha incorretos.'); return }
    toast.success('Bem-vindo!')
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--brand-primary)]/5 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center mb-4">
              <Lock size={26} className="text-[var(--brand-primary)]" />
            </div>
            <div className="font-display text-foreground text-2xl tracking-widest">MEGAFORT</div>
            <div className="font-body text-muted-foreground text-xs tracking-widest uppercase mt-1">Painel Administrativo</div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input {...register('email')} type="email" placeholder="admin@megafort.com.br"
                  autoComplete="email" className="form-input pl-10" />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input {...register('password')} type={show ? 'text' : 'password'} placeholder="••••••••"
                  autoComplete="current-password" className="form-input pl-10 pr-11" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--brand-button)] text-black font-display text-lg tracking-widest rounded-xl hover:opacity-90 disabled:opacity-60 transition-all mt-2">
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
              {isSubmitting ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

          <p className="text-center font-body text-muted-foreground text-xs mt-6">Acesso restrito</p>
        </div>
      </motion.div>
    </div>
  )
}
