class Writer {
  templateCache
  constructor() {
    this.templateCache = {
      _cache: {},
      set: function set(key, value) {
        this._cache[key] = value
      },
      get: function get(key) {
        return this._cache[key]
      },
      clear: function clear() {
        this._cache = {}
      }
    }
  }

  clearCache() {
    if (typeof this.templateCache !== 'undefined') {
      this.templateCache.clear()
    }
  }

  parse(template, tags) {
    const cache = this.templateCache
    const cacheKey = template + ':' + (tags || mustache.tags).join(':')
    const isCacheEnabled = typeof cache !== 'undefined'
    const tokens = isCacheEnabled ? cache.get(cacheKey) : undefined

    if (tokens == undefined) {
      tokens = parseTemplate(template, tags)
      isCacheEnabled && cache.set(cacheKey, tokens)
    }
    return tokens
  }

  render(template, view, partials, config) {
    const tags = this.getConfigTags(config)
    const tokens = this.parse(template, tags)
    const context = view instanceof Context ? view : new Context(view, undefined)
    return this.renderTokens(tokens, context, partials, template, config)
  }

  renderTokens(tokens, context, partials, originalTemplate, config) {
    const buffer = ''

    const token, symbol, value
    for (const i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined
      token = tokens[i]
      symbol = token[0]

      if (symbol === '#')
        value = this.renderSection(token, context, partials, originalTemplate, config)
      else if (symbol === '^')
        value = this.renderInverted(token, context, partials, originalTemplate, config)
      else if (symbol === '>') value = this.renderPartial(token, context, partials, config)
      else if (symbol === '&') value = this.unescapedValue(token, context)
      else if (symbol === 'name') value = this.escapedValue(token, context, config)
      else if (symbol === 'text') value = this.rawValue(token)

      if (value !== undefined) buffer += value
    }

    return buffer
  }

  renderSection(token, context, partials, originalTemplate, config) {
    const self = this
    const buffer = ''
    const value = context.lookup(token[1])

    function subRender(template) {
      return self.render(template, context, partials, config)
    }

    if (!value) return

    if (Array.isArray(value)) {
      for (const j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(
          token[4],
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
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config)
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template')

      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender)

      if (value != null) buffer += value
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate, config)
    }
    return buffer
  }

  renderInverted(token, context, partials, originalTemplate, config) {
    const value = context.lookup(token[1])

    if (!value || (Array.isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate, config)
  }

  indentPartial(partial, indentation, lineHasNonSpace) {
    const filteredIndentation = indentation.replace(/[^ \t]/g, '')
    const partialByNl = partial.split('\n')
    for (const i = 0; i < partialByNl.length; i++) {
      if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
        partialByNl[i] = filteredIndentation + partialByNl[i]
      }
    }
    return partialByNl.join('\n')
  }

  renderPartial(token, context, partials, config) {
    if (!partials) return
    const tags = this.getConfigTags(config)

    const value = isFunction(partials) ? partials(token[1]) : partials[token[1]]
    if (value != null) {
      let lineHasNonSpace = token[6]
      let indentedValue = value
      const tagIndex = token[5]
      const indentation = token[4]
      if (tagIndex == 0 && indentation) {
        indentedValue = this.indentPartial(value, indentation, lineHasNonSpace)
      }
      const tokens = this.parse(indentedValue, tags)
      return this.renderTokens(tokens, context, partials, indentedValue, config)
    }
  }

  unescapedValue(token, context) {
    const value = context.lookup(token[1])
    if (value != null) return value
  }

  escapedValue(token, context, config) {
    const escape = this.getConfigEscape(config) || mustache.escape
    const value = context.lookup(token[1])
    if (value != null)
      return typeof value === 'number' && escape === mustache.escape ? String(value) : escape(value)
  }

  rawValue(token) {
    return token[1]
  }

  getConfigTags(config) {
    if (Array.isArray(config)) {
      return config
    } else if (config && typeof config === 'object') {
      return config.tags
    } else {
      return undefined
    }
  }

  getConfigEscape(config) {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      return config.escape
    } else {
      return undefined
    }
  }
}
