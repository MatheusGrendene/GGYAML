import sodium from 'libsodium-wrappers'

export async function encryptSecret(publicKeyBase64: string, value: string): Promise<string> {
  await sodium.ready
  const publicKeyBytes = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL)
  const secretBytes    = sodium.from_string(value)
  const encrypted      = sodium.crypto_box_seal(secretBytes, publicKeyBytes)
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL)
}