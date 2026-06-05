import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { KeyResult, Objective, PlanningPeriod } from '../types'
import { createSeedPeriod } from '../utils/seed'
import { nextKeyResultId } from '../utils/keyResultId'
import { nextObjectiveId, normalizePeriods } from '../utils/objectiveId'
import { getDefaultQuarterDates, getDefaultQuarterName } from '../utils/quarterly'
import { validateKeyResultWeights, validatePeriodActivation } from '../utils/validation'
import { selectSelectedPeriod } from './selectors'

type OkrState = {
  periods: PlanningPeriod[]
  selectedPeriodId: string | null
  executiveMode: boolean
  expandedObjectives: Record<string, boolean>
}

type OkrActions = {
  selectPeriod: (id: string) => void
  toggleExecutiveMode: () => void
  toggleObjectiveExpanded: (objectiveId: string) => void
  collapseAllObjectives: () => void

  createPeriod: (name?: string, startDate?: string, endDate?: string) => void
  activatePeriod: (periodId: string) => { success: boolean; errors: string[] }
  closePeriod: (periodId: string) => void
  duplicatePeriod: (periodId: string) => void
  updatePeriod: (periodId: string, updates: Partial<Pick<PlanningPeriod, 'name' | 'startDate' | 'endDate'>>) => void

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
}

export type OkrStore = OkrState & OkrActions

function cloneObjective(objective: Objective, objectiveId: string): Objective {
  return {
    ...objective,
    id: uuidv4(),
    objectiveId,
    status: 'Draft',
    keyResults: objective.keyResults.map((kr) => ({
      ...kr,
      id: uuidv4(),
      keyResultId: kr.keyResultId,
      current: kr.baseline,
    })),
  }
}

function updatePeriodInList(
  periods: PlanningPeriod[],
  periodId: string,
  updater: (period: PlanningPeriod) => PlanningPeriod,
): PlanningPeriod[] {
  return periods.map((p) => (p.id === periodId ? updater(p) : p))
}

export const useOkrStore = create<OkrStore>()(
  persist(
    (set, get) => ({
      periods: [createSeedPeriod()],
      selectedPeriodId: null,
      executiveMode: false,
      expandedObjectives: {},

      selectPeriod: (id) => set({ selectedPeriodId: id }),

      toggleExecutiveMode: () =>
        set((state) => {
          const next = !state.executiveMode
          if (next) {
            const collapsed = Object.fromEntries(
              Object.keys(state.expandedObjectives).map((k) => [k, false]),
            )
            return { executiveMode: true, expandedObjectives: collapsed }
          }
          return { executiveMode: false }
        }),

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
        }))

        return { success: true, errors: [] }
      },

      closePeriod: (periodId) =>
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId ? { ...p, status: 'Closed' as const } : p,
          ),
        })),

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
        }))
      },

      updatePeriod: (periodId, updates) =>
        set((state) => ({
          periods: updatePeriodInList(state.periods, periodId, (p) => ({
            ...p,
            ...updates,
          })),
        })),

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
        })),

      updateObjective: (periodId, objectiveId, updates) =>
        set((state) => ({
          periods: updatePeriodInList(state.periods, periodId, (p) => ({
            ...p,
            objectives: p.objectives.map((o) =>
              o.id === objectiveId ? { ...o, ...updates } : o,
            ),
          })),
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
        })),

      deleteKeyResult: (periodId, objectiveId, krId) =>
        set((state) => ({
          periods: updatePeriodInList(state.periods, periodId, (p) => ({
            ...p,
            objectives: p.objectives.map((o) =>
              o.id === objectiveId
                ? {
                    ...o,
                    keyResults: o.keyResults.filter((kr) => kr.id !== krId),
                  }
                : o,
            ),
          })),
        })),
    }),
    {
      name: 'tech-okr-store',
      partialize: (state) => ({
        periods: state.periods,
        selectedPeriodId: state.selectedPeriodId,
        executiveMode: state.executiveMode,
        expandedObjectives: state.expandedObjectives,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<OkrState> | undefined
        if (!stored?.periods) return current

        return {
          ...current,
          ...stored,
          periods: normalizePeriods(stored.periods),
        }
      },
    },
  ),
)

/** Convenience hook for the currently selected period. */
export function useSelectedPeriod(): PlanningPeriod | undefined {
  const periods = useOkrStore((s) => s.periods)
  const selectedPeriodId = useOkrStore((s) => s.selectedPeriodId)
  return selectSelectedPeriod(periods, selectedPeriodId)
}
