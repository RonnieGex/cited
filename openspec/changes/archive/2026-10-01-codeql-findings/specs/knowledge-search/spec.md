## ADDED Requirements

### Requirement: A Word document keeps its text as written

The conversion of a DOCX SHALL remove the markup of the converter's HTML, repeating the removal until the text no
longer changes, and only then SHALL decode the entities of that HTML, each one once and in a single pass, so the
passage reads what the author typed.

#### Scenario: An entity is decoded once

- **WHEN** a paragraph of a DOCX reads `5 &lt; 6` as its author typed it, so the converter's HTML holds `5 &amp;lt; 6`
- **THEN** the passage reads `5 &lt; 6`
- **AND** a paragraph that reads `5 < 6`, held as `5 &lt; 6` in the HTML, gives a passage that reads `5 < 6`

#### Scenario: Markup is removed whole and text that looks like markup stays

- **WHEN** the converter's HTML is `<p><a href="#x">Horario</a><br/>Lunes</p><p>Escribe &lt;b&gt; para negritas</p>`
- **THEN** the text reads `Horario`, `Lunes` and `Escribe <b> para negritas` on three lines, and no other tag is left
- **AND** HTML cut before its `>`, such as `<p>Horario</p><em sin-cierre`, gives the text `Horario`

### Requirement: The size limit is read from the file that is read

The ingestion of a file from disk SHALL open the file once, SHALL read its size from that open file and SHALL read its
bytes from that same open file, at most the limit plus one byte, so a file can be neither swapped nor grown between the
check of the 20 MB limit and the read.

#### Scenario: A file above the limit on disk

- **WHEN** a file of more than 20 MB is ingested from disk
- **THEN** it is refused with the limit it crossed, its size comes from the open file, and none of its bytes is read

#### Scenario: A file that grows after it was measured

- **WHEN** a file measures 5 bytes when it is opened and grows to more than 20 MB before its bytes are read
- **THEN** at most 20 MB and one byte are read, it is refused with the limit it crossed, and nothing of it is parsed
