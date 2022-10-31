import { env } from 'process'
import { config } from 'dotenv-cra'

export const register = () => {
  env.NODE_ENV ??= 'development'
  config()
}

register()
