from pathlib import Path
import sqlite3, json, hashlib
records = []
for path in sorted(Path(".data").glob("*.sqlite")):
    connection = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
    tables = connection.execute("select name from sqlite_master where type='table' order by name").fetchall()
    rows = {name: connection.execute('select count(*) from "' + name.replace('"', '""') + '"').fetchone()[0] for name, in tables}
    connection.close()
    records.append({"file": path.as_posix(), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "rows": rows})
print(json.dumps({"databases": records}, indent=2))
