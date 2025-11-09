import { useNitroApp } from '#imports'
import { consola } from 'consola'
import type { ConsolaInstance } from 'consola'

/**
 * Access the shared Nitro logger with an optional tag.
 * Falls back to a plain consola instance when tagging is not needed.
 */
export function useServerLogger(tag?: string): ConsolaInstance {
  const nitro = useNitroApp() as any
  const baseLogger = nitro?.logger as ConsolaInstance | undefined
  const resolvedLogger = baseLogger ?? consola

  return tag && typeof resolvedLogger.withTag === 'function'
    ? resolvedLogger.withTag(tag)
    : resolvedLogger
}
