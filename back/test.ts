import mustache from './mustache'

const render = mustache.render as any

render('Hello {{name}} {{obj.value}} {{#get}}123{{obj.ok}}{{/get}}', {
  name: 'John',
  obj: () => {
    return {
      value: 'Doe',
      ok: 'ok'
    }
  },
  get: () => {
    return (text, render) => {
      return 'get: ' + render(text)
    }
  }
})
