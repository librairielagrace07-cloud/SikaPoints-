import { format, startOfMonth } from 'date-fns'

export function getPeriode(searchParams: Record<string, string | string[] | undefined>) {
  const raw = (k: string) => {
    const v = searchParams[k]
    return typeof v === 'string' ? v : undefined
  }
  const debut = raw('debut') ?? format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const fin   = raw('fin')   ?? format(new Date(), 'yyyy-MM-dd')
  return { debut, fin }
}
