import { View } from './types'
import { typeStr, escapeHtml } from './utils'
import { Writer } from './writer'

export class Mustache {
  name = 'mustache.js'
  version = '4.2.0'
  tags = ['{{', '}}']
  templateCache: any

  Writer = new Writer()

  constructor() {}

  clearCache() {
    return this.Writer.clearCache()
  }

  parse(template: string, tags: string[]) {
    return this.Writer.parse(template, tags)
  }

  render(
    template: string,
    view: View,
    partials?: Record<string, any>,
    config?: Record<string, any>
  ) {
    if (typeof template !== 'string') {
      throw new TypeError(
        'Invalid template! Template should be a "string" ' +
          'but "' +
          typeStr(template) +
          '" was given as the first ' +
          'argument for mustache#render(template, view, partials)'
      )
    }

    return this.Writer.render(template, view, partials, config)
  }

  escape() {
    return escapeHtml
  }
}

export default new Mustache()
