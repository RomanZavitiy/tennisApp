// A data export (task 6.14) shows an opponent only as first name + last
// initial, never their full name — `User.name` has no first/last split
// (task 1.10), so this derives it from the one free-text field instead.
export function firstNameAndInitial(name: string | null): string {
  if (!name) {
    return "Player";
  }
  const parts = name.trim().split(/\s+/);
  const [first, ...rest] = parts;
  const last = rest.at(-1);
  if (!last) {
    return first;
  }
  return `${first} ${last[0].toUpperCase()}.`;
}
