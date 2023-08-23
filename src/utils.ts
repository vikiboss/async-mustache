export function isFunction(object) {
  return typeof object === 'function'
}

export function typeStr(obj) {
  return Array.isArray(obj) ? 'array' : typeof obj
}

export function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
}

export function hasProperty(obj, propName) {
  return obj != null && typeof obj === 'object' && propName in obj
}

export function primitiveHasOwnProperty(primitive, propName) {
  return (
    primitive != null &&
    typeof primitive !== 'object' &&
    primitive.hasOwnProperty &&
    primitive.hasOwnProperty(propName)
  )
}

export const regExpTest = RegExp.prototype.test
export function testRegExp(re, string) {
  return regExpTest.call(re, string)
}

export const nonSpaceRe = /\S/
export function isWhitespace(string) {
  return !testRegExp(nonSpaceRe, string)
}

export const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

export function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
    return entityMap[s]
  })
}

export const whiteRe = /\s*/
export const spaceRe = /\s+/
export const equalsRe = /\s*=/
export const curlyRe = /\s*\}/
export const tagRe = /#|\^|\/|>|\{|&|=|!/

function parseTemplate(template, tags) {
  if (!template) return []

  const sections: string[] = []
  const tokens: (string | number | boolean)[][] = []

  let spaces: number[] = []
  let hasTag = false
  let lineHasNonSpace = false
  let nonSpace = false
  let indentation = ''
  let tagIndex = 0

  function stripSpace() {
    if (hasTag && !nonSpace) {
      while (spaces.length) delete tokens[spaces.pop()!]
    } else {
      spaces = []
    }

    hasTag = false
    nonSpace = false
  }

  let openingTagRe = new RegExp('null'),
    closingTagRe = new RegExp('null'),
    closingCurlyRe = new RegExp('null')

  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile === 'string') tagsToCompile = tagsToCompile.split(spaceRe, 2)

    if (!Array.isArray(tagsToCompile) || tagsToCompile.length !== 2)
      throw new Error('Invalid tags: ' + tagsToCompile)

    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*')
    closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]))
    closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]))
  }

  compileTags(tags || mustache.tags)

  const scanner = new Scanner(template)

  let start: string, type: string, value: string, chr: string, token: string, openSection: string

  while (!scanner.eos()) {
    start = scanner.pos

    value = scanner.scanUntil(openingTagRe)

    if (value) {
      for (let i = 0, valueLength = value.length; i < valueLength; ++i) {
        chr = value.charAt(i)

        if (isWhitespace(chr)) {
          spaces.push(tokens.length)
          indentation += chr
        } else {
          nonSpace = true
          lineHasNonSpace = true
          indentation += ' '
        }

        tokens.push(['text', chr, start, start + 1])
        start += 1

        if (chr === '\n') {
          stripSpace()
          indentation = ''
          tagIndex = 0
          lineHasNonSpace = false
        }
      }
    }

    if (!scanner.scan(openingTagRe)) break

    hasTag = true

    type = scanner.scan(tagRe) || 'name'
    scanner.scan(whiteRe)

    if (type === '=') {
      value = scanner.scanUntil(equalsRe)
      scanner.scan(equalsRe)
      scanner.scanUntil(closingTagRe)
    } else if (type === '{') {
      value = scanner.scanUntil(closingCurlyRe)
      scanner.scan(curlyRe)
      scanner.scanUntil(closingTagRe)
      type = '&'
    } else {
      value = scanner.scanUntil(closingTagRe)
    }

    if (!scanner.scan(closingTagRe)) throw new Error('Unclosed tag at ' + scanner.pos)

    if (type == '>') {
      token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace]
    } else {
      token = [type, value, start, scanner.pos]
    }
    tagIndex++
    tokens.push(token)

    if (type === '#' || type === '^') {
      sections.push(token)
    } else if (type === '/') {
      openSection = sections.pop()

      if (!openSection) throw new Error('Unopened section "' + value + '" at ' + start)

      if (openSection[1] !== value)
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + start)
    } else if (type === 'name' || type === '{' || type === '&') {
      nonSpace = true
    } else if (type === '=') {
      compileTags(value)
    }
  }

  stripSpace()

  openSection = sections.pop()

  if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos)

  return nestTokens(squashTokens(tokens))
}

function squashTokens(tokens) {
  const squashedTokens = []

  const token, lastToken
  for (const i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i]

    if (token) {
      if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
        lastToken[1] += token[1]
        lastToken[3] = token[3]
      } else {
        squashedTokens.push(token)
        lastToken = token
      }
    }
  }

  return squashedTokens
}

function nestTokens(tokens) {
  const nestedTokens = []
  const collector = nestedTokens
  const sections = []

  const token, section
  for (const i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i]

    switch (token[0]) {
      case '#':
      case '^':
        collector.push(token)
        sections.push(token)
        collector = token[4] = []
        break
      case '/':
        section = sections.pop()
        section[5] = token[2]
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens
        break
      default:
        collector.push(token)
    }
  }

  return nestedTokens
}
