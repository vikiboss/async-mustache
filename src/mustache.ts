import { typeStr, escapeHtml } from './utils'

class Mustache {
  name: string
  version: string
  tags: string[]
  templateCache: any

  Scanner?: Scanner
  Context?: Context
  Writer?: Writer

  constructor() {
    this.name = 'mustache.js'
    this.version = '4.2.0'
    this.tags = ['{{', '}}']

    this.Scanner = undefined
    this.Context = undefined
    this.Writer = new Writer()
  }

  clearCache() {
    return this.Writer?.clearCache()
  }

  parse(template, tags) {
    return this.Writer?.parse(template, tags)
  }

  render(template, view, partials, config) {
    if (typeof template !== 'string') {
      throw new TypeError(
        'Invalid template! Template should be a "string" ' +
          'but "' +
          typeStr(template) +
          '" was given as the first ' +
          'argument for mustache#render(template, view, partials)'
      )
    }

    return this.Writer?.render(template, view, partials, config)
  }

  escape() {
    return escapeHtml
  }
}

export default new Mustache()
