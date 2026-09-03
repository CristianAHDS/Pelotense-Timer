import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 3000
const DIST_DIR = path.join(__dirname, '..', 'dist')

const app = express()
const server = http.createServer(app)

const wss = new WebSocketServer({ server, path: '/ws' })

let latestState = null

function broadcast(sender, data) {
  const msg = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client !== sender && client.readyState === 1) {
      client.send(msg)
    }
  }
}

wss.on('connection', (ws) => {
  if (latestState) {
    ws.send(JSON.stringify({ type: 'state', data: latestState }))
  }

  ws.on('message', (raw) => {
    let parsed
    try {
      parsed = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (parsed.type === 'state') {
      latestState = parsed.data
      broadcast(ws, { type: 'state', data: parsed.data })
    } else if (parsed.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }))
    }
  })
})

app.use(express.static(DIST_DIR))

app.get('*splat', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
