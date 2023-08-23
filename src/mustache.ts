import { View } from './types'
import { escapeHtml } from './utils'
import { Writer } from './writer'

export class Mustache {
  name = 'mustacheee'
  tags = ['{{', '}}']
  Writer = new Writer()

  clearCache() {
    return this.Writer.clearCache()
  }

  parse(template: string, tags: string[] = this.tags) {
    return this.Writer.parse(template, tags)
  }

  render(
    template: string,
    view: View,
    partials?: Record<string, any>,
    config?: Record<string, any>
  ) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ')
    }

    return this.Writer.render(template, view, partials, config)
  }

  escape() {
    return escapeHtml
  }
}

export default new Mustache()
