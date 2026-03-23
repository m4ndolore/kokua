import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
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

function renderWranglerConfig(profile, vars) {
  const root = process.cwd()
  const baseConfig = JSON.parse(readFileSync(join(root, 'wrangler.json'), 'utf8'))

  // Resolve paths relative to .runtime/ back to project root so wrangler
  // can find the build output when using --config .runtime/wrangler.<profile>.json
  const rendered = { ...baseConfig }
  if (rendered.main) rendered.main = join('..', rendered.main)
  if (rendered.assets?.directory) {
    rendered.assets = { ...rendered.assets, directory: join('..', rendered.assets.directory) }
  }
  rendered.vars = { ...(baseConfig.vars ?? {}), ...vars }

  mkdirSync(join(root, '.runtime'), { recursive: true })
  const outputPath = join(root, `.runtime/wrangler.${profile}.json`)
  writeFileSync(outputPath, `${JSON.stringify(rendered, null, 2)}\n`)
  return outputPath
}

const action = process.argv[2]
const profile = process.argv[3]

if (!action || !profile) {
  console.error('usage: node scripts/cloudflare-command.mjs <build|preview|deploy> <profile>')
  process.exit(1)
}

run('node', ['config/doctor.mjs', profile], process.env)
run('node', ['scripts/render-env.mjs', profile], process.env)

const config = loadProfile(profile)
const env = {
  ...process.env,
  ...config.worker,
}
const wranglerConfig = renderWranglerConfig(profile, config.worker)

// OpenNext 1.5.x emits process.chdir("") in the server handler which throws
// "no such file or directory" on Cloudflare Workers. Patch it to a no-op after build.
function patchChdirBug() {
  const handlerPath = join(process.cwd(), '.open-next/server-functions/default/handler.mjs')
  if (!existsSync(handlerPath)) return
  const src = readFileSync(handlerPath, 'utf8')
  const patched = src.replace(
    'function setNextjsServerWorkingDirectory(){process.chdir("")}',
    'function setNextjsServerWorkingDirectory(){}'
  )
  if (patched !== src) {
    writeFileSync(handlerPath, patched)
    console.log('cloudflare-command: patched empty process.chdir in handler.mjs')
  }
}

if (action === 'build') {
  run('npx', ['opennextjs-cloudflare', 'build'], env)
  patchChdirBug()
} else if (action === 'preview') {
  run('npx', ['opennextjs-cloudflare', 'build'], env)
  patchChdirBug()
  run('npx', ['wrangler', 'dev', '--config', wranglerConfig], env)
} else if (action === 'deploy') {
  run('npx', ['opennextjs-cloudflare', 'build'], env)
  patchChdirBug()
  run('npx', ['wrangler', 'deploy', '--config', wranglerConfig], env)
} else {
  console.error(`unknown action: ${action}`)
  process.exit(1)
}
