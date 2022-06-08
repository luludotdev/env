import { type Environment } from './index.js'

class EnvironmentError extends Error {
  public readonly environment: Environment

  constructor(environment: Environment, message?: string) {
    super(message)
    this.environment = environment
  }
}

export class RequiredError extends EnvironmentError {
  constructor(environment: Environment) {
    const message = `Missing environment variable: ${environment.name}`
    super(environment, message)
  }
}

export class ParseError extends EnvironmentError {
  constructor(type: string, environment: Environment) {
    const message = `Invalid environment variable: ${environment.name}, expected type \`${type}\``
    super(environment, message)
  }
}
