import { config } from 'dotenv-cra'
import { env } from 'node:process'

env.NODE_ENV ??= 'development'
config()
