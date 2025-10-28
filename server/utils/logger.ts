/**
 * Logger utility using Consola for structured logging.
 */

import { createConsola } from 'consola'

const config = useRuntimeConfig()

const level = config.public.nodeEnv === 'production' ? 3 : 4
const appName = config.public.appName || 'TimeHub'

export const logger = createConsola({ level }).withTag(appName)
export const dbLogger = logger.withTag('db')
export const authLogger = logger.withTag('auth')
