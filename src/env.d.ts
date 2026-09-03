/// <reference types="astro/client" />

declare module '*.yaml' {
  // biome-ignore lint/suspicious/noExplicitAny: YAML config with no schema, loose typing
  const value: Record<string, any>
  export default value
}

declare module '*.json' {
  // biome-ignore lint/suspicious/noExplicitAny: JSON module declarations with loose typing
  const value: Record<string, any>
  export default value
}
