/// <reference types="astro/client" />

declare module '*.json' {
  // biome-ignore lint/suspicious/noExplicitAny: JSON module declarations with loose typing
  const value: Record<string, any>
  export default value
}
