import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { widgetSource } from "../lib/widget/script.ts";

const target = resolve(import.meta.dirname, "..", "public", "widget.js");
const source = widgetSource();

writeFileSync(target, source, "utf8");
console.log(`wrote public/widget.js (${Buffer.byteLength(source, "utf8")} bytes)`);
