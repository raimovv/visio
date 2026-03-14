export {}

declare global {
  interface Window {
    visio: import('@shared/ipc').RendererApi
  }
}
