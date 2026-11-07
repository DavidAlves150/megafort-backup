/** Only server-managed app_metadata may grant administrative access. */
export function isAdministrator(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.app_metadata?.role === 'admin'
}
