import { Context } from './context.js'
import { escapeHtml, isFunction, parseTemplate } from './utils.js'

import type { ExtToken } from './types.js'

export class Writer {
  templateCache = {
    _cache: {} as Record<string, ExtToken[]>,
    set: function set(key: string, value: ExtToken[]) {
      this._cache[key] = value
    },
    get: function get(key: string) {
      return this._cache[key]
    },
    clear: function clear() {
      this._cache = {}
    }
  }

  clearCache() {
    this.templateCache.clear()
  }

  async parse(template: string, tags: string[]) {
    const cache = this.templateCache
    const cacheKey = template + ':' + tags.join(':')
    const tokens = cache.get(cacheKey)

    if (tokens) return tokens

    const parsedTokens = await parseTemplate(template, tags)

    cache.set(cacheKey, parsedTokens)

    return parsedTokens
  }

  async render(
    template: string,
    view: Record<string, any>,
    partials?: Record<string, any>,
    config?: Record<string, any>
  ) {
    const tags = this.getConfigTags(config)
    const tokens = await this.parse(template, tags)
    const context = view instanceof Context ? view : new Context(view, undefined)
    return await this.renderTokens(tokens, context, partials, template, config)
  }

  async renderTokens(
    tokens: ExtToken[],
    context: Context,
    partials?: Record<string, any>,
    originalTemplate?: string,
    config?: Record<string, any>
  ) {
    let buffer = ''

    let token, symbol, value

    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined
      token = tokens[i]
      symbol = token[0]

      if (symbol === '#')
        value = await this.renderSection(token, context, partials, originalTemplate, config)
      else if (symbol === '^')
        value = await this.renderInverted(token, context, partials, originalTemplate, config)
      else if (symbol === '>') value = await this.renderPartial(token, context, partials, config)
      else if (symbol === '&') value = await this.unescapedValue(token, context)
      else if (symbol === 'name')
        value = await this.escapedValue(token, context, config as Record<string, any>)
      else if (symbol === 'text') value = this.rawValue(token)

      if (value !== undefined) buffer += value
    }

    return buffer
  }

  async renderSection(
    token: ExtToken,
    context: Context,
    partials?: Record<string, any>,
    originalTemplate?: string,
    config?: Record<string, any>
  ) {
    let buffer = ''
    let value = await context.lookup(token[1])
    const self = this

    async function subRender(template: string) {
      return await self.render(template, context, partials, config)
    }

    if (!value) return

    if (Array.isArray(value)) {
      for (let j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += await this.renderTokens(
          token[4] as unknown as ExtToken[],
          context.push(value[j]),
          partials,
          originalTemplate,
          config
        )
      }
    } else if (
      typeof value === 'object' ||
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      buffer += await this.renderTokens(
        token[4] as unknown as ExtToken[],
        context.push(value),
        partials,
        originalTemplate,
        config
      )
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template')

      value = await value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender)

      if (value != null) buffer += value
    } else {
      buffer += await this.renderTokens(
        token[4] as unknown as ExtToken[],
        context,
        partials,
        originalTemplate,
        config
      )
    }
    return buffer
  }

  async renderInverted(
    token: ExtToken,
    context: Context,
    partials?: Record<string, any>,
    originalTemplate?: string,
    config?: Record<string, any>
  ) {
    const value = await context.lookup(token[1])

    if (!value || (Array.isArray(value) && value.length === 0))
      return await this.renderTokens(
        token[4] as unknown as ExtToken[],
        context,
        partials,
        originalTemplate,
        config
      )
  }

  async indentPartial(partial: string, indentation: string, lineHasNonSpace?: boolean) {
    const filteredIndentation = indentation.replace(/[^ \t]/g, '')
    const partialByNl = partial.split('\n')
    for (let i = 0; i < partialByNl.length; i++) {
      if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
        partialByNl[i] = filteredIndentation + partialByNl[i]
      }
    }
    return partialByNl.join('\n')
  }

  async renderPartial(
    token: ExtToken,
    context: Context,
    partials?: Record<string, any> | Function,
    config?: Record<string, any>
  ) {
    if (!partials) return
    const tags = this.getConfigTags(config)

    const value = isFunction(partials)
      ? await (partials as Function)(token[1])
      : (partials as Record<string, any>)[token[1]]
    if (value != null) {
      let lineHasNonSpace = token[6]
      let indentedValue = value
      const tagIndex = token[5]
      const indentation = token[4]
      if (tagIndex == 0 && indentation) {
        indentedValue = await this.indentPartial(value, indentation, lineHasNonSpace)
      }
      const tokens = await this.parse(indentedValue, tags)
      return await this.renderTokens(tokens, context, partials, indentedValue, config)
    }
  }

  async unescapedValue(token: ExtToken, context: Context) {
    const value = await context.lookup(token[1])
    if (value != null) return value
  }

  async escapedValue(token: ExtToken, context: Context, config?: Record<string, any>) {
    const escape = this.getConfigEscape(config)
    const value = await context.lookup(token[1])
    if (value != null) return typeof value === 'number' ? String(value) : escape(value)
  }

  rawValue(token: ExtToken) {
    return token[1]
  }

  getConfigTags(config?: Record<string, any>) {
    if (Array.isArray(config)) {
      return config
    } else if (config && typeof config === 'object') {
      return config.tags
    } else {
      return ['{{', '}}']
    }
  }

  getConfigEscape(config?: Record<string, any>) {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      return config.escape
    } else {
      return escapeHtml
    }
  }
}
