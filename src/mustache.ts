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

  async parse(template: string, tags: string[] = this.tags) {
    return await this.Writer.parse(template, tags)
  }

  async render(
    template: string,
    view: View,
    partials?: Record<string, any>,
    config?: Record<string, any>
  ) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ')
    }

    return await this.Writer.render(template, view, partials, config)
  }

  escape() {
    return escapeHtml
  }
}

export default new Mustache()
