export type Advisory = { identifier: string; package: string; severity: string; title: string };

export type Verdict = {
  ok: boolean;
  lines: string[];
  problems: string[];
  entries: number;
  nearestExpiry: string | null;
};

export type Inputs = {
  audit: unknown;
  productionAudit: unknown;
  productionTree: unknown;
  exceptions: unknown;
  day: string;
};

export type Options = {
  auditFile: string | null;
  productionAuditFile: string | null;
  productionTreeFile: string | null;
  exceptionsFile: string;
  day: string;
};

export function today(): string;
export function advisoriesOf(payload: unknown, label: string): Advisory[];
export function productionPackagesOf(tree: unknown, label?: string): Set<string>;
export function evaluate(inputs: Inputs): Verdict;
export function parseArguments(argv: string[]): Options;
export function inputsFrom(options: Options): Inputs;
export function main(argv: string[], log?: (line: string) => void): number;
