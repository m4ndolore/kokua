import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function parseEnvFile(path) {
  const values = {}
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...rest] = trimmed.split('=')
    values[key.trim()] = rest.join('=').trim()
  }
  return values
}

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

const profile = process.argv[2] || 'development'
const config = loadProfile(profile)
const secrets = parseEnvFile(join(process.cwd(), '.dev.vars'))

const result = spawnSync('npx', ['next', 'dev'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...config.worker,
    ...secrets,
  },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
