import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { createReadStream, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(__dirname, 'dist', 'client')
const port = parseInt(process.env.PORT || '3000', 10)

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function loadApp() {
  const mod = await import('./dist/server/server.js')
  return mod.default
}

const app = await loadApp()

const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname

    if (pathname.startsWith('/assets/')) {
      const filePath = join(clientDir, pathname)
      if (existsSync(filePath)) {
        const ext = extname(filePath)
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        })
        createReadStream(filePath).pipe(res)
        return
      }
    }

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
