# Read-only database capture method

The same Python program was executed through `python -` before the full validation and after the completed E2E run. The only changed output filename was database-before.json to database-after.json. It did not initialize, migrate or write a database. Scope is the current repository and its local test databases, not other projects.

```python
from pathlib import Path
import sqlite3, json, hashlib
repo = Path.cwd()
files = []
for folder in ['.data', 'data']:
    directory = repo / folder
    if directory.exists():
        for file in directory.rglob('*'):
            if file.is_file() and file.suffix in ['.sqlite', '.db']:
                db = sqlite3.connect(file.resolve().as_uri() + '?mode=ro', uri=True)
                tables = [row[0] for row in db.execute("select name from sqlite_master where type='table' order by name")]
                counts = {table: db.execute('select count(*) from "' + table.replace('"', '""') + '"').fetchone()[0] for table in tables}
                db.close()
                files.append({'path': str(file.relative_to(repo)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'tables': counts})
print(json.dumps({'scope': 'Local test databases only; read-only SQLite, no initialization', 'files': files}, indent=2))
```

The executed workspace loop supplied each repository path and saved this printed structure to the adjacent before/after JSON artifacts. These files preserve the actual counts and hashes.
