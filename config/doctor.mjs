import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG_SCHEMA, isPlaceholder } from './schema.mjs'

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

function fail(message) {
  console.error(`doctor: ${message}`)
  process.exit(1)
}

const profile = process.argv[2]

if (!profile || !CONFIG_SCHEMA.profiles.includes(profile)) {
  fail(`profile must be one of: ${CONFIG_SCHEMA.profiles.join(', ')}`)
}

const config = loadProfile(profile)

for (const key of CONFIG_SCHEMA.targets.worker.requiredNonSecrets) {
  const value = config.worker[key]
  if (value === undefined) {
    fail(`missing worker non-secret "${key}" in config/profiles`)
  }
  if (isPlaceholder(value)) {
    fail(`worker non-secret "${key}" still uses a placeholder value`)
  }
}

for (const key of CONFIG_SCHEMA.targets.worker.requiredSecrets) {
  const value = process.env[key]
  if (!value || isPlaceholder(value)) {
    fail(`required runtime secret "${key}" is missing from process.env`)
  }
}

console.log(`doctor: ${profile} configuration is valid`)
