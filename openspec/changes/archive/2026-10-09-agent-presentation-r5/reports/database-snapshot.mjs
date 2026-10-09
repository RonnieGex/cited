import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

export function databaseSnapshot(path) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({ name }) => {
      const rows = db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()
      const serialized = rows.map((row) => JSON.stringify(row)).sort().join('\n')
      return { table: name, rows: rows.length, sha256: createHash('sha256').update(serialized).digest('hex') }
    })
  } finally { db.close() }
}
