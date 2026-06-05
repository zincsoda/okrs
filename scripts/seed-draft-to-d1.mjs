import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const exportPath = join(root, 'local-okr-export.json')
const data = JSON.parse(readFileSync(exportPath, 'utf8'))

const draftPeriod =
  data.state.periods.find((p) => p.status === 'Draft') ??
  data.state.periods.find((p) => p.name.includes('P1')) ??
  data.state.periods.find((p) => p.name.includes('P2'))

if (!draftPeriod) {
  console.error('No draft period found in local export')
  process.exit(1)
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

const statements = [
  'DELETE FROM key_results;',
  'DELETE FROM objectives;',
  'DELETE FROM planning_periods;',
  'DELETE FROM app_settings;',
  `INSERT INTO planning_periods (id, name, start_date, end_date, status) VALUES (${[
    sqlString(draftPeriod.id),
    sqlString(draftPeriod.name),
    sqlString(draftPeriod.startDate),
    sqlString(draftPeriod.endDate),
    sqlString(draftPeriod.status),
  ].join(', ')});`,
]

for (const objective of draftPeriod.objectives) {
  statements.push(
    `INSERT INTO objectives (id, period_id, objective_id, title, description, owner, weight, status) VALUES (${[
      sqlString(objective.id),
      sqlString(draftPeriod.id),
      sqlString(objective.objectiveId),
      sqlString(objective.title),
      objective.description ? sqlString(objective.description) : 'NULL',
      sqlString(objective.owner),
      objective.weight,
      sqlString(objective.status),
    ].join(', ')});`,
  )

  for (const kr of objective.keyResults) {
    statements.push(
      `INSERT INTO key_results (id, objective_id, key_result_id, title, owner, baseline, target, current, weight, confidence, notes) VALUES (${[
        sqlString(kr.id),
        sqlString(objective.id),
        sqlString(kr.keyResultId),
        sqlString(kr.title),
        sqlString(kr.owner),
        kr.baseline,
        kr.target,
        kr.current,
        kr.weight,
        sqlString(kr.confidence),
        kr.notes ? sqlString(kr.notes) : 'NULL',
      ].join(', ')});`,
    )
  }
}

if (data.state.selectedPeriodId) {
  statements.push(
    `INSERT INTO app_settings (key, value) VALUES ('selectedPeriodId', ${sqlString(data.state.selectedPeriodId)});`,
  )
}

const seedSql = statements.join('\n')
const seedPath = join(root, 'migrations/0002_seed_draft.sql')
writeFileSync(seedPath, seedSql)

console.log(`Prepared seed for period: ${draftPeriod.name} (${draftPeriod.status})`)
console.log(`Objectives: ${draftPeriod.objectives.length}`)
console.log(
  `Key results: ${draftPeriod.objectives.reduce((sum, o) => sum + o.keyResults.length, 0)}`,
)
console.log(`Wrote ${seedPath}`)
