# Revisión adversarial independiente

Fecha: 2026-10-09. Revisor: Codex `/root/r7_review`, sin autoría del contrato ni de la implementación. Rama: `docs/brand-logos`. Base: `8fa96930861bc1cab05028a558a9fd23c36115eb`. Revisión emitida después de leer `2026-10-09-step-8-verify.md`, antes del archivo y commit.

**Veredicto: PASS WITH GAPS.** Blocker: 0. Major: 0. Minor: 1.

## Alcance y evidencia

Leí el encargo R7, el estándar SDD, el contrato completo y el diff de fuentes, pruebas, CI y documentación, incluidos los archivos nuevos. No hay cambios en runtime, API, dependencias, lockfile ni evidencia original. Revisé visualmente los doce PNG modificados: cuatro de agents, dos de reason-voice, dos de voice-teaser, dos de how-it-works y dos de roadmap. Los logos conservan proporciones, contraste y espacio; el texto y la leyenda distinguen correctamente los tres niveles de verificación. Docker conserva su estado Planned.

Ejecuté de forma independiente, con Node 24.21.0:

```sh
node node_modules/vitest/vitest.mjs run tests/brand-logos.test.ts
```

Resultado: exit 0, 4/4 pruebas. La regresión de Docker ejecuta un helper aislado con la entrada Docker retirada del inventario, requiere AssertionError y exit 1, y comprueba el logo y estado actuales. Los hashes fijados independientemente, viewBox y atributos geométricos pasan. La transformación mantiene las etiquetas SVG completas y sólo modifica presentación, accesibilidad e identificadores locales.

También ejecuté desde el workspace una comprobación Node con `readFileSync`, `createHash('sha256')` y `fetch(record.url)` sobre los tres `sources.json`: 20 marcas únicas, 20 respuestas cuyos bytes coinciden con el SHA-256 documentado y ninguna discrepancia entre repositorios. Esto incluye Claude, Codex, DeepSeek, Cursor, ElevenLabs, libSQL, Turso, Ollama y Docker usados aquí. Las URL exactas, versiones y hashes reproducibles están en `docs/brand-logos.md` y el inventario.

Contrasté los resultados de verificación contra sus logs: 1170 pruebas del checkpoint, 51 pruebas focalizadas finales, 96 E2E, lint/types/build/audit aprobados y doce renders sin fallas de fuentes, recortes o cobertura. Curl registra diez respuestas 200. El inventario de base previo registra ausencia y los posteriores describen por separado la base vacía creada por pruebas y los fixtures E2E. La documentación no afirma conservación de una base que no existía. El escaneo de directorio está limpio.

## Hallazgos

1. **Minor, RISK: cronología de TDD de la enmienda Docker.** La prueba específica se añadió después de implementar el logo. `2026-10-09-step-1-tdd.md` lo declara y las tareas 1.2 y 2.4 no reclaman la secuencia original. La prueba aislada demuestra detección de la omisión y el resultado final satisface el contrato funcional, pero no reconstruye una secuencia tests-first. No se requiere modificar producto ni falsear el historial para cerrar este hallazgo.

No encontré defectos Blocker o Major. El archivo puede continuar conservando este gap explícito. El commit, PR y checks remotos corresponden al cierre posterior; este reporte no los declara ejecutados.

## Comprobación independiente de fuentes

Este programa se ejecutó desde el workspace con Node 24.21.0 y `--input-type=module`, recibido por stdin desde un here-string PowerShell:

```js
import fs from 'node:fs';
import crypto from 'node:crypto';
const dirs=['community-brand-logos/docs/brand/logos/','dsh-cited/docs/brand/logos/','cited-landing/assets/brand/logos/'];
const records = new Map();
for(const dir of dirs){const m=JSON.parse(fs.readFileSync(dir+'sources.json'));for(const [name,r] of Object.entries(m)){const data=fs.readFileSync(dir+r.file);const hash=crypto.createHash('sha256').update(data).digest('hex'); if(hash!==r.sha256)throw Error(dir+name+' local hash mismatch');if(records.has(name)&&records.get(name).sha256!==hash)throw Error(name+' cross repo mismatch');records.set(name,r);}}
const results=await Promise.all([...records].map(async ([name,r])=>{const response=await fetch(r.url);if(!response.ok)throw Error(name+' HTTP '+response.status);const b=Buffer.from(await response.arrayBuffer());const hash=crypto.createHash('sha256').update(b).digest('hex');return {name,match:hash===r.sha256,hash};}));
console.log(JSON.stringify({unique:records.size,results},null,2));
if(results.some(r=>!r.match))process.exitCode=1;
```

Salida: exit 0; `unique:20`; todos los `match:true`. Cada hash devuelto coincide con el inventario publicado en este cambio. La comprobación descargó únicamente los SVG públicos, sin enviar textos de clientes.

## Issues

- RISK: desfase de TDD de Docker descrito arriba, mitigado por regresión real y documentado sin alterar la cronología.
