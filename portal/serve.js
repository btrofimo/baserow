import { createServer } from 'node:http'
import { Readable } from 'node:stream'

const port = parseInt(process.env.PORT || '3000', 10)

async function loadApp() {
  const mod = await import('./dist/server/server.js')
  return mod.default
}

const app = await loadApp()

const server = createServer(async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host || `localhost:${port}`
    const url = new URL(req.url || '/', `${protocol}://${host}`)

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const body = hasBody ? Readable.toWeb(req) : undefined

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
      duplex: hasBody ? 'half' : undefined,
    })

    const response = await app.fetch(request)

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()))

    if (response.body) {
      const reader = response.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      }
      await pump()
    } else {
      const text = await response.text()
      res.end(text)
    }
  } catch (err) {
    console.error('Request error:', err)
    if (!res.headersSent) {
      res.writeHead(500)
      res.end('Internal Server Error')
    }
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Portal server listening on http://0.0.0.0:${port}`)
})
