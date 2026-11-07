const staging = 'https://bzhrugqkwxlyfdgtenlt.supabase.co'
const production = 'https://dpksjzfopgpytmfyydol.supabase.co'
if (process.env.CONTEXT === 'production') {
  if (process.env.VIBE_V2_PRODUCTION_APPROVED !== 'true') {
    throw new Error('V2 aguarda aprovação e preparação do banco original. Produção preservada.')
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== production || process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
    throw new Error('Produção deve usar exclusivamente o banco original e o ambiente production.')
  }
} else if (process.env.NEXT_PUBLIC_SUPABASE_URL !== staging) {
  throw new Error('Prévias da V2 devem usar exclusivamente o banco de homologação.')
}
