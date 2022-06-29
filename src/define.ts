import { env } from 'node:process'
import { ParseError, RequiredError, ValidateError } from './errors.js'
import {
  parseBoolValue,
  parseFloatValue,
  parseIntValue,
  ParseValueError,
} from './parse.js'
import {
  type InferType,
  type Mappings,
  type MonoEnvironment,
  type Type,
  types,
} from './type.js'

type Template = Record<string, MonoEnvironment>
type Values<T extends Template> = {
  readonly [K in keyof T]: InferType<T[K]['type'], T[K]['isRequired']>
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

        const { type, defaultValue, validateFn: valueValidateFn } = environment
        const name = environment.name ?? prop
        const required = environment.isRequired

        const rawValue = env[name]
        if (rawValue === undefined) {
          if (required) throw new RequiredError(prop, environment)

          const value = defaultValue !== undefined ? defaultValue : undefined
          if (valueValidateFn !== undefined) {
            const validateResult = valueValidateFn(value)
            if (typeof validateResult === 'string') {
              throw new ValidateError(validateResult, prop, environment)
            }
          }

          return undefined
        }

        try {
          const value = validate(type, rawValue)
          if (valueValidateFn !== undefined) {
            const validateResult = valueValidateFn(value)
            if (typeof validateResult === 'string') {
              throw new ValidateError(validateResult, prop, environment)
            }
          }

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
