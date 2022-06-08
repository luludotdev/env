import { env } from 'node:process'
import { ParseError, RequiredError } from './errors.js'
import {
  parseBoolValue,
  parseFloatValue,
  parseIntValue,
  ParseValueError,
} from './parse.js'

export * from './errors.js'

export const string = Symbol('string')
export const int = Symbol('int')
export const float = Symbol('float')
export const bool = Symbol('bool')

export type Type = typeof types[number]
const types = [string, int, float, bool] as const

type InferType<T extends Type, R extends boolean | undefined> = R extends true
  ? Mappings[T]
  : Mappings[T] | undefined

interface Mappings {
  [string]: string
  [int]: number
  [float]: number
  [bool]: boolean
}

export interface Environment {
  name: string
  type: Type
  required?: boolean
}

type Template = Record<string, Environment>
type Values<T extends Template> = {
  readonly [K in keyof T]: InferType<T[K]['type'], T[K]['required']>
}

export function createEnv<T extends Template>(template: T): Values<T> {
  const proxy = new Proxy<Values<T>>(
    // @ts-expect-error Proxy Target
    {},
    {
      get(_, prop) {
        if (typeof prop === 'symbol') return undefined

        const environment = template[prop]
        const { name, type } = environment
        const required = environment.required ?? false

        const rawValue = env[name]
        if (rawValue === undefined) {
          if (required) throw new RequiredError(environment)
          return undefined
        }

        try {
          const value = validate(type, rawValue)
          return value
        } catch (error: unknown) {
          if (error instanceof ParseValueError) {
            throw new ParseError(error.type, environment)
          }

          throw error
        }
      },
    }
  )

  return proxy
}

const validate: <T extends Type>(type: T, value: string) => Mappings[T] = (
  type,
  rawValue
) => {
  switch (type) {
    case string: {
      return rawValue
    }

    case int: {
      const value = parseIntValue(rawValue)
      return value
    }

    case float: {
      const value = parseFloatValue(rawValue)
      return value
    }

    case bool: {
      const value = parseBoolValue(rawValue)
      return value
    }

    default:
      throw new Error('unknown parse type')
  }
}
