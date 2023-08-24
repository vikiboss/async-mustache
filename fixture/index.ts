import mustache from '../src'

const template = 'Hello {{name}}, {{asyncValue}}, {{#asyncRender}}asyncRender{{/asyncRender}}'

const view = {
  name: 'John',
  asyncValue: async () => {
    return Promise.resolve('async value')
  },
  asyncRender: () => {
    return (text, render) => {
      return new Promise(resolve => {
        setTimeout(async () => {
          resolve('async-' + (await render(text)) + '-async')
        }, 1000)
      })
    }
  }
}

// 1 second later: Hello John, async value, async-asyncRender-async
mustache.render(template, view).then(output => {
  console.log(output)
})
