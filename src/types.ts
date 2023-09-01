export type Token = [string, string, number, number]
export type ExtToken = [string, string, number, number, string?, number?, boolean?]

export type BasicViewValue = string | number | boolean | null | undefined
export type PureViewValue = BasicViewValue | Record<string, unknown>
export type Res = PureViewValue | Promise<PureViewValue>

export type PureRenderResult = string
export type RenderResult = PureRenderResult | Promise<PureRenderResult>

export type MusRender = (text: string) => RenderResult | Promise<RenderResult>
export type RenderFunction = (text: string, render: MusRender) => Res
export type RenderValue = () => RenderFunction
export type ViewValue = Res | (() => Res) | RenderValue

export type View = {
  [attr: string]: ViewValue
}
