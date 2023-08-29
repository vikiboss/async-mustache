import { hasProperty, isFunction, primitiveHasOwnProperty } from './utils.js'

import type { View } from './types.js'

export class Context {
  view: View
  cache: Record<string, any>
  parent?: Context

  constructor(view: View, parentContext?: Context) {
    this.view = view
    this.cache = { '.': this.view }
    this.parent = parentContext
  }

  push(view: View) {
    return new Context(view, this)
  }

  async lookup(name: string) {
    const cache = this.cache

    let value

    if (cache.hasOwnProperty(name)) {
      value = cache[name]
    } else {
      let context: Context | undefined = this,
        intermediateValue: View,
        names: string[],
        index: number,
        lookupHit = false

      while (context) {
        if (name.indexOf('.') > 0) {
          intermediateValue = context.view
          names = name.split('.')
          index = 0

          while (intermediateValue != null && index < names.length) {
            if (index === names.length - 1) {
              lookupHit =
                hasProperty(intermediateValue, names[index]) ||
                primitiveHasOwnProperty(intermediateValue, names[index])
            }

            intermediateValue = intermediateValue[names[index++]] as View
          }
        } else {
          intermediateValue = context.view![name] as View
          lookupHit = hasProperty(context.view, name)
        }

        if (lookupHit) {
          value = intermediateValue
          break
        }

        context = context.parent
      }

      cache[name] = value
    }

    if (isFunction(value)) {
      value = await value.call(this.view)
    }

    return value
  }
}
