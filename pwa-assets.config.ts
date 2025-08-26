import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      purpose: 'any'
    },
    maskable: {
      sizes: [512],
      padding: 0.05
    },
    apple: {
      sizes: [180],
      padding: 0.05
    }
  },
  images: ['public/icon.svg']
})