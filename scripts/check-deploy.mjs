const staging = 'https://bzhrugqkwxlyfdgtenlt.supabase.co'
if (process.env.CONTEXT === 'production') {
  if (process.env.VIBE_V2_PRODUCTION_APPROVED !== 'true') {
    throw new Error('V2 aguarda aprovação e preparação do banco original. Produção preservada.')
  }
} else if (process.env.NEXT_PUBLIC_SUPABASE_URL !== staging) {
  throw new Error('Prévias da V2 devem usar exclusivamente o banco de homologação.')
}
