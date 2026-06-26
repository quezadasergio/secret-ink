// Authenticated encryption for Secret Ink using the Web Crypto API.
//
// AES-256-GCM with a key derived from From + To + Password through PBKDF2.
// Each message uses a fresh random salt and IV, so the same message never
// produces the same ciphertext, and GCM's tag detects wrong keys or tampering.
//
// This module is intentionally isolated so the algorithm can evolve without
// touching the UI.

const PBKDF2_ITERATIONS = 150_000
const SALT_BYTES = 16
const IV_BYTES = 12
const KEY_BITS = 256

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// Combines all three pieces into the key material. The NUL separators stop
// ambiguous combinations from colliding (e.g. ("ab","c") vs ("a","bc")).
function keyMaterial(from: string, to: string, password: string): string {
  return `${from}\u0000${to}\u0000${password}`
}

async function deriveKey(material: string, salt: BufferSource): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(material), 'PBKDF2', false, [
    'deriveKey',
  ])

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  )
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.trim())
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

// Deterministic but one-way decoy returned when decryption fails: the same wrong
// data always yields the same output (so there is no brute-force signal that the
// data was wrong), yet it never reveals From/To/Password.
async function decoy(from: string, to: string, password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(keyMaterial(from, to, password)))
  return bytesToBase64(new Uint8Array(digest))
}

export async function encrypt(
  message: string,
  from: string,
  to: string,
  password: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(keyMaterial(from, to, password), salt)

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(message)),
  )

  // Pack salt + iv + ciphertext(+tag) into a single Base64 blob.
  const blob = new Uint8Array(salt.length + iv.length + ciphertext.length)
  blob.set(salt, 0)
  blob.set(iv, salt.length)
  blob.set(ciphertext, salt.length + iv.length)
  return bytesToBase64(blob)
}

export async function decrypt(
  ciphertext: string,
  from: string,
  to: string,
  password: string,
): Promise<string> {
  try {
    const blob = base64ToBytes(ciphertext)
    const salt = blob.slice(0, SALT_BYTES)
    const iv = blob.slice(SALT_BYTES, SALT_BYTES + IV_BYTES)
    const data = blob.slice(SALT_BYTES + IV_BYTES)

    const key = await deriveKey(keyMaterial(from, to, password), salt)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return decoder.decode(plain)
  } catch {
    // Wrong data/keys or tampered input: return the deterministic decoy.
    return decoy(from, to, password)
  }
}
