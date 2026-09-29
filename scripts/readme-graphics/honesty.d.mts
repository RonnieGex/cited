export declare const answerWords: RegExp;
export declare const plannedMark: RegExp;
export declare const capturedOutput: string;
export declare function isCapturedOutput(record: unknown, route: string, value: unknown): boolean;
export declare function untaggedClaims(record: unknown): string[];
export declare function assertHonestRecord(record: unknown, label: string): void;
