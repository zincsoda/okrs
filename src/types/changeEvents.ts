export type OkrEntityType = 'period' | 'objective' | 'key_result'
export type ChangeAction = 'created' | 'updated' | 'deleted' | 'saved'

export type ChangeEvent = {
  id: string
  entityType: OkrEntityType
  entityId: string
  periodId: string
  entityLabel: string
  action: ChangeAction
  field: string | null
  oldValue: string | null
  newValue: string | null
  userDisplay: string
  createdAt: string
}
