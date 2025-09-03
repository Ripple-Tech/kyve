import type { Config } from "tailwindcss"

const config: Config = {
  theme: {
    extend: {
      colors: {
       primary: {
      DEFAULT: "#F6A730", // Light theme
      dark: "#7A4B0E",    // golden dark variant
    },
      },
    },
  },
}

export default config
