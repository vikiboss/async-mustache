import mustache from '../src'

const res = mustache.render('Hello {{name}} {{obj.value}} {{#get}}123{{obj.ok}}{{/get}}', {
  name: null,
  obj: {
    value: undefined,
    ok: false
  },
  get: () => (text, render) => 'get: ' + render(text)
})

console.log(res)
