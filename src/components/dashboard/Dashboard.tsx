import { useOkrStore, useSelectedPeriod } from '../../store/okrStore'
import { BuildInfoFooter } from '../layout/BuildInfoFooter'
import { PageShell } from '../layout/PageShell'
import { EmptyState } from '../ui/EmptyState'
import { DashboardHeader } from './DashboardHeader'
import { ObjectiveCard } from '../objective/ObjectiveCard'

const dashboardFooter = <BuildInfoFooter />

export function Dashboard() {
  const period = useSelectedPeriod()
  const expandedObjectives = useOkrStore((s) => s.expandedObjectives)

  if (!period) {
    return (
      <PageShell footer={dashboardFooter}>
        <EmptyState
          title="No planning periods yet"
          description="An administrator can create a planning period from the Admin page."
        />
      </PageShell>
    )
  }

  return (
    <PageShell footer={dashboardFooter}>
      <DashboardHeader period={period} />

      <section className="space-y-4">
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
          <EmptyState title="No objectives in this period" />
        )}
      </section>
    </PageShell>
  )
}
