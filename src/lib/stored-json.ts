// Stored server results are saved as JSON text, and plain JSON turns a Date
// into a string ("2026-11-20T09:00:00.000Z"). The calendar code calls Date
// methods on its results, so these two helpers mark each Date on the way in
// ({ "$date": "..." }) and turn it back into a real Date on the way out.

const DATE_MARKER = "$date";

export function toStoredJson(value: unknown): string {
  return JSON.stringify(value ?? null, function (key, converted) {
    // `converted` already went through Date.toJSON, so look at the original.
    const original = (this as Record<string, unknown>)[key];
    return original instanceof Date ? { [DATE_MARKER]: original.toISOString() } : converted;
  });
}

export function fromStoredJson<Result>(text: string): Result {
  return JSON.parse(text, (_key, value) => {
    const isMarkedDate =
      value !== null &&
      typeof value === "object" &&
      typeof value[DATE_MARKER] === "string" &&
      Object.keys(value).length === 1;
    return isMarkedDate ? new Date(value[DATE_MARKER]) : value;
  }) as Result;
}
