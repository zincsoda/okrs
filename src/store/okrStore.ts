import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { fetchOkrState, saveOkrState, saveSelectedPeriod } from '../api/okrApi'
import type { KeyResult, Objective, PeriodStatus, PlanningPeriod } from '../types'
import { nextKeyResultId, renumberKeyResults } from '../utils/keyResultId'
import { nextObjectiveId, normalizePeriods } from '../utils/objectiveId'
import { getDefaultQuarterDates, getDefaultQuarterName, getNextPeriodFromSource } from '../utils/quarterly'
import { validateKeyResultWeights, validatePeriodActivation } from '../utils/validation'
import { selectSelectedPeriod } from './selectors'

type HydrationStatus = 'loading' | 'ready' | 'error'
type SaveStatus = 'idle' | 'saving' | 'error'

type OkrState = {
  periods: PlanningPeriod[]
  selectedPeriodId: string | null
  expandedObjectives: Record<string, boolean>
  hydrationStatus: HydrationStatus
  hydrationError: string | null
  saveStatus: SaveStatus
  saveError: string | null
  isDirty: boolean
}

type OkrActions = {
  hydrateFromApi: () => Promise<void>
  selectPeriod: (id: string) => void
  toggleObjectiveExpanded: (objectiveId: string) => void
  collapseAllObjectives: () => void

  createPeriod: (name?: string, startDate?: string, endDate?: string) => void
  activatePeriod: (periodId: string) => { success: boolean; errors: string[] }
  closePeriod: (periodId: string) => void
  setPeriodDraft: (periodId: string) => void
  setPeriodStatus: (periodId: string, status: PeriodStatus) => { success: boolean; errors: string[] }
  duplicatePeriod: (periodId: string) => void
  createNextPeriod: (
    sourcePeriodId: string,
    options?: {
      name?: string
      startDate?: string
      endDate?: string
      removePlaceholderKeyResults?: boolean
    },
  ) => string | null
  updatePeriod: (periodId: string, updates: Partial<Pick<PlanningPeriod, 'name' | 'startDate' | 'endDate'>>) => void
  deletePeriod: (periodId: string) => void

  addObjective: (
    periodId: string,
    objective: Omit<Objective, 'id' | 'objectiveId' | 'keyResults' | 'status'> & { objectiveId?: string },
  ) => void
  updateObjective: (periodId: string, objectiveId: string, updates: Partial<Objective>) => void
  deleteObjective: (periodId: string, objectiveId: string) => void
  activateObjective: (periodId: string, objectiveId: string) => { success: boolean; errors: string[] }

  addKeyResult: (periodId: string, objectiveId: string, kr: Omit<KeyResult, 'id' | 'keyResultId'>) => void
  updateKeyResult: (
    periodId: string,
    objectiveId: string,
    krId: string,
    updates: Partial<KeyResult>,
  ) => void
  deleteKeyResult: (periodId: string, objectiveId: string, krId: string) => void
  reorderKeyResults: (periodId: string, objectiveId: string, activeId: string, overId: string) => void
  saveChanges: () => Promise<{ success: boolean; errors: string[] }>
}

export type OkrStore = OkrState & OkrActions

function cloneObjective(
  objective: Objective,
  objectiveId: string,
  removePlaceholderKeyResults = false,
): Objective {
  const keyResults = objective.keyResults
    .filter((kr) => !removePlaceholderKeyResults || kr.title.trim().toLowerCase() !== 'tmp')
    .map((kr) => ({
      ...kr,
      id: uuidv4(),
      keyResultId: kr.keyResultId,
      current: kr.baseline,
    }))

  return {
    ...objective,
    id: uuidv4(),
    objectiveId,
    status: 'Draft',
    keyResults,
  }
}

function updatePeriodInList(
  periods: PlanningPeriod[],
  periodId: string,
  updater: (period: PlanningPeriod) => PlanningPeriod,
): PlanningPeriod[] {
  return periods.map((p) => (p.id === periodId ? updater(p) : p))
}

export const useOkrStore = create<OkrStore>()((set, get) => ({
  periods: [],
  selectedPeriodId: null,
  expandedObjectives: {},
  hydrationStatus: 'loading',
  hydrationError: null,
  saveStatus: 'idle',
  saveError: null,
  isDirty: false,

  hydrateFromApi: async () => {
    set({ hydrationStatus: 'loading', hydrationError: null })

    try {
      const remote = await fetchOkrState()
      set({
        periods: normalizePeriods(remote.periods),
        selectedPeriodId: remote.selectedPeriodId,
        hydrationStatus: 'ready',
        hydrationError: null,
        isDirty: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load OKRs'
      set({
        hydrationStatus: 'error',
        hydrationError: message,
      })
    }
  },

  selectPeriod: (id) => {
    set({ selectedPeriodId: id })
    void saveSelectedPeriod(id).catch(() => {})
  },

  toggleObjectiveExpanded: (objectiveId) =>
    set((state) => ({
      expandedObjectives: {
        ...state.expandedObjectives,
        [objectiveId]: !state.expandedObjectives[objectiveId],
      },
    })),

  collapseAllObjectives: () =>
    set((state) => ({
      expandedObjectives: Object.fromEntries(
        Object.keys(state.expandedObjectives).map((k) => [k, false]),
      ),
    })),

  createPeriod: (name, startDate, endDate) => {
    const defaults = getDefaultQuarterDates()
    const period: PlanningPeriod = {
      id: uuidv4(),
      name: name ?? getDefaultQuarterName(),
      startDate: startDate ?? defaults.startDate,
      endDate: endDate ?? defaults.endDate,
      status: 'Draft',
      objectives: [],
    }
    set((state) => ({
      periods: [...state.periods, period],
      selectedPeriodId: period.id,
      isDirty: true,
    }))
  },

  activatePeriod: (periodId) => {
    const period = get().periods.find((p) => p.id === periodId)
    if (!period) return { success: false, errors: ['Period not found.'] }

    const validation = validatePeriodActivation(period)
    if (!validation.valid) return { success: false, errors: validation.errors }

    set((state) => ({
      periods: state.periods.map((p) => {
        if (p.id === periodId) {
          return {
            ...p,
            status: 'Active' as const,
            objectives: p.objectives.map((o) => ({
              ...o,
              status: 'Active' as const,
            })),
          }
        }
        if (p.status === 'Active') {
          return { ...p, status: 'Closed' as const }
        }
        return p
      }),
      selectedPeriodId: periodId,
      isDirty: true,
    }))

    return { success: true, errors: [] }
  },

  closePeriod: (periodId) =>
    set((state) => ({
      periods: state.periods.map((p) =>
        p.id === periodId ? { ...p, status: 'Closed' as const } : p,
      ),
      isDirty: true,
    })),

  setPeriodDraft: (periodId) =>
    set((state) => ({
      periods: state.periods.map((p) =>
        p.id === periodId
          ? {
              ...p,
              status: 'Draft' as const,
              objectives: p.objectives.map((o) => ({ ...o, status: 'Draft' as const })),
            }
          : p,
      ),
      isDirty: true,
    })),

  setPeriodStatus: (periodId, status) => {
    if (status === 'Active') return get().activatePeriod(periodId)
    if (status === 'Closed') {
      get().closePeriod(periodId)
      return { success: true, errors: [] }
    }
    get().setPeriodDraft(periodId)
    return { success: true, errors: [] }
  },

  duplicatePeriod: (periodId) => {
    const source = get().periods.find((p) => p.id === periodId)
    if (!source) return

    const { startDate, endDate } = getDefaultQuarterDates()
    const clonedObjectives: Objective[] = []
    const duplicate: PlanningPeriod = {
      id: uuidv4(),
      name: `${source.name} (Copy)`,
      startDate,
      endDate,
      status: 'Draft',
      objectives: source.objectives.map((objective) => {
        const objectiveId = nextObjectiveId(clonedObjectives)
        const cloned = cloneObjective(objective, objectiveId)
        clonedObjectives.push(cloned)
        return cloned
      }),
    }

    set((state) => ({
      periods: [...state.periods, duplicate],
      selectedPeriodId: duplicate.id,
      isDirty: true,
    }))
  },

  createNextPeriod: (sourcePeriodId, options) => {
    const source = get().periods.find((p) => p.id === sourcePeriodId)
    if (!source) return null

    const nextDefaults = getNextPeriodFromSource(source)
    const removePlaceholders = options?.removePlaceholderKeyResults ?? true
    const clonedObjectives: Objective[] = []

    const nextPeriod: PlanningPeriod = {
      id: uuidv4(),
      name: options?.name ?? nextDefaults.name,
      startDate: options?.startDate ?? nextDefaults.startDate,
      endDate: options?.endDate ?? nextDefaults.endDate,
      status: 'Draft',
      objectives: source.objectives.map((objective) => {
        const objectiveId = nextObjectiveId(clonedObjectives)
        const cloned = cloneObjective(objective, objectiveId, removePlaceholders)
        clonedObjectives.push(cloned)
        return cloned
      }),
    }

    set((state) => ({
      periods: [...state.periods, nextPeriod],
      selectedPeriodId: nextPeriod.id,
      isDirty: true,
    }))

    return nextPeriod.id
  },

  updatePeriod: (periodId, updates) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        ...updates,
      })),
      isDirty: true,
    })),

  deletePeriod: (periodId) =>
    set((state) => {
      const period = state.periods.find((p) => p.id === periodId)
      if (!period) return state

      const remaining = state.periods.filter((p) => p.id !== periodId)
      const objectiveIds = new Set(period.objectives.map((o) => o.id))

      let selectedPeriodId = state.selectedPeriodId
      if (selectedPeriodId === periodId) {
        const active = remaining.find((p) => p.status === 'Active')
        selectedPeriodId = active?.id ?? remaining[0]?.id ?? null
      }

      return {
        periods: remaining,
        selectedPeriodId,
        expandedObjectives: Object.fromEntries(
          Object.entries(state.expandedObjectives).filter(([k]) => !objectiveIds.has(k)),
        ),
        isDirty: true,
      }
    }),

  addObjective: (periodId, objective) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: [
          ...p.objectives,
          {
            ...objective,
            id: uuidv4(),
            objectiveId: objective.objectiveId ?? nextObjectiveId(p.objectives),
            status: 'Draft',
            keyResults: [],
          },
        ],
      })),
      isDirty: true,
    })),

  updateObjective: (periodId, objectiveId, updates) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.map((o) =>
          o.id === objectiveId ? { ...o, ...updates } : o,
        ),
      })),
      isDirty: true,
    })),

  deleteObjective: (periodId, objectiveId) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.filter((o) => o.id !== objectiveId),
      })),
      expandedObjectives: Object.fromEntries(
        Object.entries(state.expandedObjectives).filter(([k]) => k !== objectiveId),
      ),
      isDirty: true,
    })),

  activateObjective: (periodId, objectiveId) => {
    const period = get().periods.find((p) => p.id === periodId)
    const objective = period?.objectives.find((o) => o.id === objectiveId)
    if (!objective) return { success: false, errors: ['Objective not found.'] }

    const validation = validateKeyResultWeights(objective)
    if (!validation.valid) return { success: false, errors: validation.errors }

    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.map((o) =>
          o.id === objectiveId ? { ...o, status: 'Active' as const } : o,
        ),
      })),
      isDirty: true,
    }))

    return { success: true, errors: [] }
  },

  addKeyResult: (periodId, objectiveId, kr) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.map((o) =>
          o.id === objectiveId
            ? {
                ...o,
                keyResults: [
                  ...o.keyResults,
                  { ...kr, id: uuidv4(), keyResultId: nextKeyResultId(o.keyResults) },
                ],
              }
            : o,
        ),
      })),
      isDirty: true,
    })),

  updateKeyResult: (periodId, objectiveId, krId, updates) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.map((o) =>
          o.id === objectiveId
            ? {
                ...o,
                keyResults: o.keyResults.map((kr) =>
                  kr.id === krId ? { ...kr, ...updates } : kr,
                ),
              }
            : o,
        ),
      })),
      isDirty: true,
    })),

  deleteKeyResult: (periodId, objectiveId, krId) =>
    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.map((o) =>
          o.id === objectiveId
            ? {
                ...o,
                keyResults: renumberKeyResults(o.keyResults.filter((kr) => kr.id !== krId)),
              }
            : o,
        ),
      })),
      isDirty: true,
    })),

  reorderKeyResults: (periodId, objectiveId, activeId, overId) => {
    if (activeId === overId) return

    set((state) => ({
      periods: updatePeriodInList(state.periods, periodId, (p) => ({
        ...p,
        objectives: p.objectives.map((o) => {
          if (o.id !== objectiveId) return o

          const oldIndex = o.keyResults.findIndex((kr) => kr.id === activeId)
          const newIndex = o.keyResults.findIndex((kr) => kr.id === overId)
          if (oldIndex < 0 || newIndex < 0) return o

          const reordered = [...o.keyResults]
          const [moved] = reordered.splice(oldIndex, 1)
          reordered.splice(newIndex, 0, moved)

          return {
            ...o,
            keyResults: renumberKeyResults(reordered),
          }
        }),
      })),
      isDirty: true,
    }))
  },

  saveChanges: async () => {
    const { periods, selectedPeriodId, hydrationStatus, isDirty } = get()
    if (hydrationStatus !== 'ready') {
      return { success: false, errors: ['OKR data is not ready to save.'] }
    }
    if (!isDirty) {
      return { success: true, errors: [] }
    }

    set({ saveStatus: 'saving', saveError: null })

    try {
      await saveOkrState({ periods, selectedPeriodId }, { recordSave: true })
      set({ saveStatus: 'idle', saveError: null, isDirty: false })
      return { success: true, errors: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save OKRs'
      set({ saveStatus: 'error', saveError: message })
      return { success: false, errors: [message] }
    }
  },
}))

/** Convenience hook for the currently selected period. */
export function useSelectedPeriod(): PlanningPeriod | undefined {
  const periods = useOkrStore((s) => s.periods)
  const selectedPeriodId = useOkrStore((s) => s.selectedPeriodId)
  return selectSelectedPeriod(periods, selectedPeriodId)
}
