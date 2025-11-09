import { useNitroApp } from '#imports'
import type { ConsolaInstance } from 'consola'

/**
 * Access the shared Nitro logger with an optional tag.
 * Falls back to a plain consola instance when tagging is not needed.
 */
export function useServerLogger(tag?: string): ConsolaInstance {
  const baseLogger = (useNitroApp() as any).logger as ConsolaInstance
  return tag ? baseLogger.withTag(tag) : baseLogger
}
