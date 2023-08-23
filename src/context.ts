import { hasProperty, isFunction, primitiveHasOwnProperty } from './utils'

export class Context {
  view
  cache
  parent

  constructor(view, parentContext) {
    this.view = view
    this.cache = { '.': this.view }
    this.parent = parentContext
  }

  push(view) {
    return new Context(view, this)
  }

  lookup(name) {
    const cache = this.cache

    let value
    if (cache.hasOwnProperty(name)) {
      value = cache[name]
    } else {
      let context = this,
        intermediateValue,
        names,
        index,
        lookupHit = false

      while (context) {
        if (name.indexOf('.') > 0) {
          intermediateValue = context.view
          names = name.split('.')
          index = 0

          while (intermediateValue != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit =
                hasProperty(intermediateValue, names[index]) ||
                primitiveHasOwnProperty(intermediateValue, names[index])

            intermediateValue = intermediateValue[names[index++]]
          }
        } else {
          intermediateValue = context.view[name]

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

    if (isFunction(value)) value = value.call(this.view)

    return value
  }
}
