import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Mantém a composição de layout sem atrasar a navegação entre páginas.
 * Animações de rota globais faziam telas já prontas parecerem lentas.
 */
export const PageTransition = ({ children }: PageTransitionProps) => <>{children}</>
