import { env } from 'node:process'
import { ParseError, RequiredError } from './errors.js'
import {
  parseBoolValue,
  parseFloatValue,
  parseIntValue,
  ParseValueError,
} from './parse.js'

const stringType = Symbol('string')
const intType = Symbol('int')
const floatType = Symbol('float')
const boolType = Symbol('bool')

export type Type = typeof types[keyof typeof types]
const types = {
  string: stringType,
  int: intType,
  float: floatType,
  bool: boolType,
} as const

type InferType<T extends Type, R extends boolean | undefined> = R extends true
  ? Mappings[T]
  : Mappings[T] | undefined

interface Mappings {
  [types.string]: string
  [types.int]: number
  [types.float]: number
  [types.bool]: boolean
}

export interface Environment {
  name?: string
  type: Type
  required?: boolean
}

type Template = Record<string, Environment>
type Values<T extends Template> = {
  readonly [K in keyof T]: InferType<T[K]['type'], T[K]['required']>
}

const validateFn = 'validate'
interface Extension {
  readonly [validateFn]: () => void
}

export function defineEnvironment<T extends Template>(
  template: T
): Values<T> & Extension {
  const proxy = new Proxy<Values<T> & Extension>(
    // @ts-expect-error Proxy Target
    {},
    {
      get(_, prop) {
        if (typeof prop === 'symbol') return undefined

        if (prop === validateFn) {
          return () => {
            void Object.entries(proxy)
          }
        }

        if (!(prop in template)) return undefined
        const environment = template[prop]

        const { type } = environment
        const name = environment.name ?? prop
        const required = environment.required ?? false

        const rawValue = env[name]
        if (rawValue === undefined) {
          if (required) throw new RequiredError(prop, environment)
          return undefined
        }

        try {
          const value = validate(type, rawValue)
          return value
        } catch (error: unknown) {
          if (error instanceof ParseValueError) {
            throw new ParseError(error.type, prop, environment)
          }

          throw error
        }
      },

      has(_, prop) {
        return prop in template
      },

      ownKeys() {
        return Reflect.ownKeys(template)
      },

      getOwnPropertyDescriptor() {
        return {
          configurable: true,
          enumerable: true,
        }
      },
    }
  )

  return proxy
}

// @ts-expect-error Ignore `never` type error
const validate: <T extends Type>(type: T, value: string) => Mappings[T] = (
  type,
  rawValue
) => {
  switch (type) {
    case types.string: {
      return rawValue
    }

    case types.int: {
      const value = parseIntValue(rawValue)
      return value
    }

    case types.float: {
      const value = parseFloatValue(rawValue)
      return value
    }

    case types.bool: {
      const value = parseBoolValue(rawValue)
      return value
    }

    default:
      throw new Error('unknown parse type')
  }
}

export { types as t }
