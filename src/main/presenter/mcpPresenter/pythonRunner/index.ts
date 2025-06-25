import type { LoggingLevel } from '@modelcontextprotocol/sdk/types.js'
import { loadPyodide } from 'pyodide'
import { preparePythonCode } from './prepareEnv'
export interface CodeFile {
  name: string
  content: string
  active: boolean
}
interface RunSuccess {
  status: 'success'
  output: string[]
  dependencies: string[]
  returnValueJson: string | null
}

interface RunError {
  status: 'install-error' | 'run-error'
  output: string[]
  dependencies?: string[]
  error: string
}

export async function runCode(
  files: CodeFile[],
  log: (level: LoggingLevel, data: string) => void
): Promise<RunSuccess | RunError> {
  const output: string[] = []
  const pyodide = await loadPyodide({
    stdout: (msg) => {
      log('info', msg)
      output.push(msg)
    },
    stderr: (msg) => {
      log('warning', msg)
      output.push(msg)
    }
  })

  // see https://github.com/pyodide/pyodide/discussions/5512
  const origLoadPackage = pyodide.loadPackage
  pyodide.loadPackage = (pkgs, options) =>
    origLoadPackage(pkgs, {
      // stop pyodide printing to stdout/stderr
      messageCallback: (msg: string) => log('debug', `loadPackage: ${msg}`),
      errorCallback: (msg: string) => {
        log('error', `loadPackage: ${msg}`)
        output.push(`install error: ${msg}`)
      },
      ...options
    })

  await pyodide.loadPackage(['micropip', 'pydantic'])
  const sys = pyodide.pyimport('sys')

  const dirPath = '/tmp/powerpack_run_python'
  sys.path.append(dirPath)
  const pathlib = pyodide.pyimport('pathlib')
  pathlib.Path(dirPath).mkdir()
  const moduleName = '_prepare_env'

  pathlib.Path(`${dirPath}/${moduleName}.py`).write_text(preparePythonCode)
  const preparePyEnv = pyodide.pyimport(moduleName)
  const prepareStatus = await preparePyEnv.prepare_env(pyodide.toPy(files))

  let runResult: RunSuccess | RunError
  if (prepareStatus.kind == 'error') {
    runResult = {
      status: 'install-error',
      output,
      error: prepareStatus.message
    }
  } else {
    const { dependencies } = prepareStatus
    const activeFile = files.find((f) => f.active)! || files[0]
    try {
      const rawValue = await pyodide.runPythonAsync(activeFile.content, {
        globals: pyodide.toPy({ __name__: '__main__' }),
        filename: activeFile.name
      })
      runResult = {
        status: 'success',
        dependencies,
        output,
        returnValueJson: preparePyEnv.dump_json(rawValue)
      }
    } catch (err) {
      runResult = {
        status: 'run-error',
        dependencies,
        output,
        error: formatError(err)
      }
    }
  }
  sys.stdout.flush()
  sys.stderr.flush()
  return runResult
}

interface RunSuccess {
  status: 'success'
  output: string[]
  dependencies: string[]
  returnValueJson: string | null
}

interface RunError {
  status: 'install-error' | 'run-error'
  output: string[]
  dependencies?: string[]
  error: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatError(err: any): string {
  let errStr = err.toString()
  errStr = errStr.replace(/^PythonError: +/, '')
  // remove frames from inside pyodide
  errStr = errStr.replace(
    / {2}File "\/lib\/python\d+\.zip\/_pyodide\/.*\n {4}.*\n(?: {4,}\^+\n)?/g,
    ''
  )
  return errStr
}
