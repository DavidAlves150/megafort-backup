type PageResult<T> = { data: T[] | null; error: { message: string } | null }

// Continue after short pages: the server may impose a smaller limit than requested.
export async function readAll<T>(page: (from: number, to: number) => PromiseLike<PageResult<T>>): Promise<PageResult<T>> {
  const rows: T[] = []
  try {
    for (;;) {
      const result = await page(rows.length, rows.length + 499)
      if (result.error) return { data: null, error: result.error }
      if (!result.data?.length) return { data: rows, error: null }
      rows.push(...result.data)
    }
  } catch {
    return { data: null, error: { message: 'Não foi possível carregar todos os registros. Tente novamente.' } }
  }
}
