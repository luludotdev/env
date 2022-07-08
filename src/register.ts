import { config } from 'dotenv-cra'
import { env } from 'node:process'

export const register = () => {
  env.NODE_ENV ??= 'development'
  config()
}

register()
