import { Extension } from '@codemirror/state'
import { langs, loadLanguage } from '@uiw/codemirror-extensions-langs'
import { glsl } from 'codemirror-lang-glsl'
import { makefile } from 'codemirror-lang-makefile'
import { terraform } from 'codemirror-lang-terraform'

export const prepareLanguage = () => {
  loadLanguage('jsx')
  loadLanguage('tsx')
  loadLanguage('vue')
  loadLanguage('csharp')
  loadLanguage('python')
  loadLanguage('java')
  loadLanguage('kotlin')
  loadLanguage('c')
  loadLanguage('cpp')
  loadLanguage('rust')
  loadLanguage('go')
  loadLanguage('powershell')
  loadLanguage('sql')
  loadLanguage('yaml')
  loadLanguage('json')
  loadLanguage('html')
  loadLanguage('css')
  loadLanguage('javascript')
  loadLanguage('typescript')
  loadLanguage('css')
  loadLanguage('markdown')
  loadLanguage('xml')
  loadLanguage('yaml')
  loadLanguage('toml')
  loadLanguage('dockerfile')
  loadLanguage('kotlin')
  loadLanguage('objectiveC')
  loadLanguage('objectiveCpp')
  loadLanguage('php')
  loadLanguage('ruby')
  loadLanguage('scala')
  loadLanguage('svelte')
  loadLanguage('swift')
  loadLanguage('erlang')
  loadLanguage('angular')
  loadLanguage('dart')
  loadLanguage('lua')
  loadLanguage('mermaid')
  loadLanguage('cmake')
  loadLanguage('nginx')
  loadLanguage('nsis')
}

export const getLanguageExtension = (lang: string): Extension => {
  const lowerLang = lang.toLowerCase()
  // Helper to safely get extension or fallback
  const getExt = (loader?: () => Extension) =>
    loader ? loader() : langs.markdown ? langs.markdown() : []

  switch (lowerLang) {
    // Handle JS/TS/JSX/TSX variants using the javascript loader with options
    case 'javascript':
    case 'js':
      return getExt(langs.javascript)
    case 'typescript':
    case 'ts':
      return langs.javascript ? langs.javascript({ typescript: true }) : getExt(langs.markdown)
    case 'jsx':
      return langs.javascript ? langs.javascript({ jsx: true }) : getExt(langs.markdown)
    case 'tsx':
      return langs.javascript
        ? langs.javascript({ jsx: true, typescript: true })
        : getExt(langs.markdown)

    // Languages directly supported by langs (keys match loadLanguage calls)
    case 'vue':
      return getExt(langs.vue)
    case 'html':
      return getExt(langs.html)
    case 'css':
      return getExt(langs.css)
    case 'json':
      return getExt(langs.json)
    case 'python':
    case 'py':
      return getExt(langs.python)
    case 'kotlin':
    case 'kt':
      return getExt(langs.kotlin)
    case 'java':
      return getExt(langs.java)
    case 'go':
    case 'golang':
      return getExt(langs.go)
    case 'markdown':
    case 'md':
      return getExt(langs.markdown)
    case 'sql':
      return getExt(langs.sql)
    case 'xml':
      return getExt(langs.xml)
    case 'cpp':
    case 'c++':
      return getExt(langs.cpp)
    case 'c':
      return getExt(langs.c || langs.cpp) // Use C if available, else fallback to C++
    case 'rust':
    case 'rs':
      return getExt(langs.rust)
    case 'bash':
    case 'sh':
    case 'shell':
    case 'zsh':
      return getExt(langs.shell)
    case 'php':
      return getExt(langs.php)
    case 'yaml':
    case 'yml':
      return getExt(langs.yaml)
    case 'swift':
      return getExt(langs.swift)
    case 'ruby':
    case 'rb':
      return getExt(langs.ruby)
    case 'perl':
      return getExt(langs.perl)
    case 'lua':
      return getExt(langs.lua)
    case 'haskell':
    case 'hs':
      return getExt(langs.haskell)
    case 'erlang':
    case 'erl':
      return getExt(langs.erlang)
    case 'clojure':
    case 'clj':
      return getExt(langs.clojure)
    case 'csharp':
    case 'cs':
      return getExt(langs.csharp)
    case 'powershell':
    case 'ps1':
      return getExt(langs.powershell)
    case 'toml':
      return getExt(langs.toml)
    case 'dockerfile':
      return getExt(langs.dockerfile)
    case 'objectivec':
      return getExt(langs.objectiveC)
    case 'objectivecpp':
      return getExt(langs.objectiveCpp)
    case 'scala':
      return getExt(langs.scala)
    case 'svelte':
      return getExt(langs.svelte)
    case 'angular':
      return getExt(langs.angular)
    case 'dart':
      return getExt(langs.dart)
    case 'mermaid':
      return getExt(langs.mermaid)
    case 'cmake':
      return getExt(langs.cmake)
    case 'nginx':
      return getExt(langs.nginx)
    case 'nsis':
      return getExt(langs.nsis)
    case 'terraform':
      return getExt(terraform)
    case 'makefile':
      return getExt(makefile)
    case 'glsl':
      return getExt(glsl)

    default: {
      // Try loading dynamically by key if not explicitly listed, otherwise fallback to markdown
      const langKey = lowerLang as keyof typeof langs // Cast for direct access attempt
      if (langs[langKey] && typeof langs[langKey] === 'function') {
        try {
          console.log(`Dynamically using langs.${lowerLang}() for language: ${lang}`)
          return getExt(langs[langKey as keyof typeof langs])
        } catch (error) {
          console.error(`Error dynamically loading language '${lowerLang}':`, error)
        }
      }
      console.warn(`Unsupported language '${lang}', falling back to markdown.`)
      return getExt(langs.markdown) // Default fallback
    }
  }
}

export const getLanguageIcon = (lang: string): string => {
  switch (lang) {
    case 'javascript':
    case 'js':
      return 'vscode-icons:file-type-js-official'
    case 'typescript':
    case 'ts':
      return 'vscode-icons:file-type-typescript'
    case 'jsx':
      return 'vscode-icons:file-type-reactjs'
    case 'tsx':
      return 'vscode-icons:file-type-reactts'
    case 'html':
      return 'vscode-icons:file-type-html'
    case 'css':
      return 'vscode-icons:file-type-css'
    case 'scss':
      return 'vscode-icons:file-type-scss'
    case 'json':
      return 'vscode-icons:file-type-json'
    case 'python':
    case 'py':
      return 'vscode-icons:file-type-python'
    case 'ruby':
    case 'rb':
      return 'vscode-icons:file-type-ruby'
    case 'go':
    case 'golang':
      return 'vscode-icons:file-type-go'
    case 'r':
      return 'vscode-icons:file-type-r'
    case 'java':
      return 'vscode-icons:file-type-java'
    case 'kotlin':
    case 'kt':
      return 'vscode-icons:file-type-kotlin'
    case 'c':
      return 'vscode-icons:file-type-c'
    case 'cpp':
    case 'c++':
      return 'vscode-icons:file-type-cpp'
    case 'cs':
    case 'csharp':
      return 'vscode-icons:file-type-csharp'
    case 'php':
      return 'vscode-icons:file-type-php'
    case 'scala':
      return 'vscode-icons:file-type-scala'
    case 'shell':
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'powershell':
    case 'ps1':
    case 'bat':
    case 'batch':
      return 'vscode-icons:file-type-powershell'
    case 'sql':
      return 'vscode-icons:file-type-sql'
    case 'yaml':
    case 'yml':
      return 'vscode-icons:file-type-yaml'
    case 'markdown':
    case 'md':
      return 'vscode-icons:file-type-markdown'
    case 'xml':
      return 'vscode-icons:file-type-xml'
    case 'rust':
    case 'rs':
      return 'vscode-icons:file-type-rust'
    case 'swift':
      return 'vscode-icons:file-type-swift'
    case 'perl':
      return 'vscode-icons:file-type-perl'
    case 'lua':
      return 'vscode-icons:file-type-lua'
    case 'haskell':
      return 'vscode-icons:file-type-haskell'
    case 'erlang':
      return 'vscode-icons:file-type-erlang'
    case 'clojure':
      return 'vscode-icons:file-type-clojure'
    case 'vue':
      return 'vscode-icons:file-type-vue'
    case 'svg':
      return 'vscode-icons:file-type-svg'
    case 'mermaid':
      return 'vscode-icons:file-type-mermaid' // Or 'mdi:graph' if mermaid icon missing
    case 'dart':
      return 'vscode-icons:file-type-dartlang'
    case 'assembly':
      return 'vscode-icons:file-type-assembly'
    case 'dockerfile':
      return 'vscode-icons:file-type-docker'
    case 'fortran':
      return 'vscode-icons:file-type-fortran'
    case 'lisp':
      return 'vscode-icons:file-type-lisp'
    case 'ocaml':
      return 'vscode-icons:file-type-ocaml'
    case 'prolog':
      return 'vscode-icons:file-type-prolog'
    case 'groovy':
      return 'vscode-icons:file-type-groovy'
    case 'matlab':
      return 'vscode-icons:file-type-matlab'
    case 'cobol':
      return 'vscode-icons:file-type-cobol'
    case 'ada':
      return 'vscode-icons:file-type-ada'
    case 'julia':
      return 'vscode-icons:file-type-julia'
    case 'elixir':
      return 'vscode-icons:file-type-elixir'
    case 'vb.net':
      return 'vscode-icons:file-type-vb'
    case 'nim':
      return 'vscode-icons:file-type-nim'
    case 'crystal':
      return 'vscode-icons:file-type-crystal'
    case 'd':
      return 'vscode-icons:file-type-dlang'
    case 'applescript':
      return 'vscode-icons:file-type-applescript'
    case 'solidity':
      return 'vscode-icons:file-type-solidity'
    case 'objectivec':
      return 'vscode-icons:file-type-objectivec'
    case 'objectivecpp':
      return 'vscode-icons:file-type-objectivecpp'
    case 'terraform':
      return 'vscode-icons:file-type-terraform'
    case 'plain':
    case 'text':
      return 'vscode-icons:file-type-text' // Icon for plain text
    default:
      return 'lucide:square-code' // Fallback icon
  }
}
