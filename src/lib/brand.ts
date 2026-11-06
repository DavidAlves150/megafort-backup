export const BRAND_DEFAULTS = { cor_primaria: '#A51C53', cor_secundaria: '#FFF1F5', cor_botao: '#FF1493' }
export function brandColors(config: Record<string, string>) {
  const colors = { ...BRAND_DEFAULTS }
  for (const key of Object.keys(colors) as Array<keyof typeof colors>) {
    const value = config[key]
    // Migrate legacy defaults without overwriting the production database.
    if (value && /^#[0-9a-f]{6}$/i.test(value) && !['#00ff41', '#ccff00', '#000000'].includes(value.toLowerCase())) colors[key] = value
  }
  return colors
}
