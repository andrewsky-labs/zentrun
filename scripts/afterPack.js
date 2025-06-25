import fs from 'fs/promises'
import path from 'path'

function isLinux(targets) {
  const re = /AppImage|snap|deb|rpm|freebsd|pacman/i
  return !!targets.find((target) => re.test(target.name))
}

async function afterPack({ targets, appOutDir }) {
  if (!isLinux(targets)) return
  const appName = 'zentrun'
  const scriptPath = path.join(appOutDir, appName)
  const script = `#!/bin/bash\n"\${BASH_SOURCE%/*}"/${appName}.bin --no-sandbox "$@"`
  await fs.rename(scriptPath, `${scriptPath}.bin`)
  await fs.writeFile(scriptPath, script)
  await fs.chmod(scriptPath, 0o755)
}

export default afterPack
