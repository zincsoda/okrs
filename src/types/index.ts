export type PeriodStatus = 'Draft' | 'Active' | 'Closed'
export type ObjectiveStatus = 'Draft' | 'Active' | 'Completed'
export type Confidence = 'High' | 'Medium' | 'Low'

export type KeyResult = {
  id: string
  keyResultId: string
  title: string
  owner: string
  baseline: number
  target: number
  current: number
  weight: number
  confidence: Confidence
  notes?: string
}

export type Objective = {
  id: string
  objectiveId: string
  title: string
  description?: string
  owner: string
  weight: number
  status: ObjectiveStatus
  keyResults: KeyResult[]
}

export type PlanningPeriod = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: PeriodStatus
  objectives: Objective[]
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
}
