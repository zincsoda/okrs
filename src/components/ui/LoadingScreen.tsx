type LoadingScreenProps = {
  message?: string
}

export function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
