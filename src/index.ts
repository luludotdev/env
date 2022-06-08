import { env } from 'node:process'

export const string = Symbol('string')
export const int = Symbol('int')
export const float = Symbol('float')
export const bool = Symbol('bool')

export type Type = typeof types[number]
export const types = [string, int, float, bool] as const

type InferType<T extends Type> = Mappings[T]
interface Mappings {
  [string]: string
  [int]: number
  [float]: number
  [bool]: boolean
}

type Environment = readonly [name: string, type: Type]
type Template = Record<string, Environment>

type Values<T extends Template> = {
  [K in keyof T]: InferType<T[K][1]>
}

export function createEnv<T extends Template>(template: T): Values<T> {
  const proxy = new Proxy<Values<T>>(
    // @ts-expect-error Proxy Target
    {},
    {
      get(_, prop) {
        if (typeof prop === 'symbol') return undefined

        const type = template[prop]
        // TODO: Validation
      },
    }
  )

  return proxy
}
