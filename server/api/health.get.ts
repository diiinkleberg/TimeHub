export default defineEventHandler(() => {
  return {
    status: 'ok, laueft',
    timestamp: new Date().toISOString(),
    app: {
      name: process.env.APP_NAME,
      env: process.env.NODE_ENV
    }
  }
})
