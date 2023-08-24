# mustache**ee**

Fork from [mustache.js](https://github.com/janl/mustache.js), add async render support.

Have no test yet, **use it at your own risk**.

## Usage

```ts
import mustache from 'mustachee'

const template = 'Hello {{name}}, {{asyncValue}}, {{#asyncRender}}asyncRender{{/asyncRender}}'

const view = {
  name: 'John',
  // async value
  asyncValue: async () => {
    return Promise.resolve('async value')
  },
  asyncRender: () => {
    // custom async render function
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

// or in async function:
// const output = await mustache.render(template, view)
```

## License

MIT
