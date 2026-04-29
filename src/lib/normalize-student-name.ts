export function normalizeStudentName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
