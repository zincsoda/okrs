import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOkrStore, useSelectedPeriod } from '../../store/okrStore'
import { isPeriodDraft, isPeriodEditable } from '../../store/selectors'
import { nextObjectiveId } from '../../utils/objectiveId'
import { formatPeriodRange } from '../../utils/formatDate'
import { validateObjectiveWeights } from '../../utils/validation'
import { UserMenu } from '../auth/UserMenu'
import { PageShell } from '../layout/PageShell'
import { PageHeader } from '../layout/PageHeader'
import { ObjectiveCard } from '../objective/ObjectiveCard'
import { ObjectiveFormModal } from '../objective/ObjectiveFormModal'
import { EmptyState } from '../ui/EmptyState'
import { SaveHistory } from '../ui/SaveHistory'
import { StatusBadge } from '../ui/StatusBadge'
import { StickySaveBar } from '../ui/StickySaveBar'

export function EditPage() {
  const period = useSelectedPeriod()
  const isDirty = useOkrStore((s) => s.isDirty)
  const saveStatus = useOkrStore((s) => s.saveStatus)
  const expandedObjectives = useOkrStore((s) => s.expandedObjectives)
  const collapseAllObjectives = useOkrStore((s) => s.collapseAllObjectives)
  const addObjective = useOkrStore((s) => s.addObjective)

  const [showObjectiveModal, setShowObjectiveModal] = useState(false)

  useEffect(() => {
    collapseAllObjectives()
    return () => collapseAllObjectives()
  }, [collapseAllObjectives])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  if (!period) {
    return (
      <PageShell>
        <EmptyState
          title="No planning periods yet"
          description="An administrator can create a planning period from the Admin page."
        />
      </PageShell>
    )
  }

  const draft = isPeriodDraft(period)
  const editable = isPeriodEditable(period)
  const weightValidation = validateObjectiveWeights(period.objectives)
  const showSaveBar = editable && (isDirty || saveStatus === 'saving' || saveStatus === 'error')

  return (
    <PageShell
      footer={showSaveBar ? <StickySaveBar /> : undefined}
    >
      <PageHeader
        eyebrow="Edit OKRs"
        title={period.name}
        badges={<StatusBadge status={period.status} />}
        subtitle={formatPeriodRange(period.startDate, period.endDate)}
        actions={
          <>
            <Link to="/" className="btn-secondary">
              Back to dashboard
            </Link>
            <UserMenu />
          </>
        }
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading">Objectives</h2>
          {editable && draft && (
            <button
              type="button"
              onClick={() => setShowObjectiveModal(true)}
              className="btn-primary btn-sm"
            >
              + Add objective
            </button>
          )}
        </div>

        {draft && period.objectives.length > 0 && !weightValidation.valid && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {weightValidation.errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {period.objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              period={period}
              expanded={expandedObjectives[objective.id] ?? false}
              interactive
            />
          ))}
        </div>

        {period.objectives.length === 0 && (
          <EmptyState
            variant="card"
            title="No objectives yet"
            description="Add your first objective to get started."
            action={
              editable && draft ? (
                <button
                  type="button"
                  onClick={() => setShowObjectiveModal(true)}
                  className="btn-primary btn-sm"
                >
                  + Add objective
                </button>
              ) : undefined
            }
          />
        )}
      </section>

      <SaveHistory periodId={period.id} />

      <ObjectiveFormModal
        open={showObjectiveModal}
        onClose={() => setShowObjectiveModal(false)}
        title="Add Objective"
        suggestedObjectiveId={nextObjectiveId(period.objectives)}
        onSubmit={(data) => {
          addObjective(period.id, {
            objectiveId: data.objectiveId,
            title: data.title,
            description: data.description || undefined,
            owner: data.owner,
            weight: data.weight,
          })
        }}
      />
    </PageShell>
  )
}
