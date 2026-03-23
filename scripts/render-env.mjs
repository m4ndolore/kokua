import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function loadProfile(profile) {
  const base = JSON.parse(readFileSync(join(process.cwd(), 'config/profiles/base.json'), 'utf8'))
  const override = JSON.parse(readFileSync(join(process.cwd(), `config/profiles/${profile}.json`), 'utf8'))
  return {
    worker: {
      ...(base.worker ?? {}),
      ...(override.worker ?? {}),
    },
  }
}

const profile = process.argv[2]
if (!profile) {
  console.error('usage: node scripts/render-env.mjs <profile>')
  process.exit(1)
}

const config = loadProfile(profile)
mkdirSync(join(process.cwd(), '.runtime'), { recursive: true })

const workerEnv = Object.entries(config.worker)
  .map(([key, value]) => `${key}=${JSON.stringify(String(value))}`)
  .join('\n')

writeFileSync(join(process.cwd(), `.runtime/${profile}.worker.env`), `${workerEnv}\n`)
console.log(`render-env: wrote .runtime/${profile}.worker.env`)
