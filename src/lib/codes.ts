// No 0/O or 1/I/L, so codes read cleanly over the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

export function generateCode(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  const body = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `${prefix}-${body}`;
}
