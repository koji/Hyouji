declare module 'oh-my-logo' {
  export interface RenderOptions {
    palette?: string[]
    font?: string
    direction?: 'horizontal' | 'vertical' | 'diagonal'
  }

  export function render(text: string, options?: RenderOptions): Promise<string>
  export function renderFilled(
    text: string,
    options?: RenderOptions,
  ): Promise<string>
  export const PALETTES: Record<string, string[]>
  export function getPaletteNames(): string[]
}
