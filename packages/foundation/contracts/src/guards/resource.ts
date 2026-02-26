export function isKind<K extends string>(kind: K) {
  return (value: unknown): value is Record<string, unknown> & { kind: K } =>
    typeof value === 'object' && value !== null && (value as Record<string, unknown>).kind === kind;
}
