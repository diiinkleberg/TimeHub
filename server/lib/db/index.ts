import { MssqlDialect } from 'kysely'
import * as Tedious from 'tedious'
import * as Tarn from 'tarn'

const config = useRuntimeConfig()

export const dialect = new MssqlDialect({
  tarn: {
    ...Tarn,
    options: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 30000,
      createRetryIntervalMillis: 200,
      destroyTimeoutMillis: 5000
    }
  },
  tedious: {
    ...Tedious,
    connectionFactory: () =>
      new Tedious.Connection({
        server: config.databaseHost,
        authentication: {
          type: 'default',
          options: {
            password: config.databasePassword,
            userName: config.databaseUser
          }
        },
        options: {
          database: config.databaseName,
          port: Number(config.databasePort),
          trustServerCertificate: true,
          encrypt: true,
          connectTimeout: 15000
        }
      })
  }
})
