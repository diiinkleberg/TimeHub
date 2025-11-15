export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: {
      name: process.env.APP_NAME,
      env: process.env.NODE_ENV
    }
  }
})
