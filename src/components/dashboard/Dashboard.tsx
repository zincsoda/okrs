import { useOkrStore, useSelectedPeriod } from '../../store/okrStore'
import { DashboardHeader } from './DashboardHeader'
import { ObjectiveCard } from '../objective/ObjectiveCard'

export function Dashboard() {
  const period = useSelectedPeriod()
  const expandedObjectives = useOkrStore((s) => s.expandedObjectives)

  if (!period) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">No planning periods yet.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader period={period} />

        <section className="space-y-3">
          {period.objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              period={period}
              expanded={expandedObjectives[objective.id] ?? false}
              expandable
            />
          ))}
          {period.objectives.length === 0 && (
            <p className="text-center text-slate-500">No objectives in this period.</p>
          )}
        </section>
      </div>
    </div>
  )
}
