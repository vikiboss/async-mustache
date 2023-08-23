type Token = string | number | (string | number)[]

type BasicViewValue = string | number | boolean | null | undefined
type PureViewValue = BasicViewValue | Record<string, unknown>
type Res = PureViewValue | Promise<PureViewValue>

type PureRenderResult = string
type RenderResult = PureRenderResult | Promise<PureRenderResult>

type Render = (text: string) => RenderResult
type RenderValue = () => (text: string, render: Render) => Res
type ViewValue = Res | (() => Res) | RenderValue

export interface View {
  [attr: string]: ViewValue
}
