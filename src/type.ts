export const stringType = Symbol('string')
export const intType = Symbol('int')
export const floatType = Symbol('float')
export const boolType = Symbol('bool')

export type Type = typeof types[keyof typeof types]
export const types = {
  string: stringType,
  int: intType,
  float: floatType,
  bool: boolType,
} as const

export interface Mappings {
  [types.string]: string
  [types.int]: number
  [types.float]: number
  [types.bool]: boolean
}

export type InferTypeBasic<T extends Type> = Mappings[T]
export type InferType<
  T extends Type,
  R extends boolean | undefined
> = R extends true ? Mappings[T] : Mappings[T] | undefined

type ValidateFn<T extends Type, R extends boolean | undefined> = (
  value: InferType<T, R>
) => void | undefined | string

interface Environment<
  T extends Type,
  Required extends boolean = false,
  Default extends InferTypeBasic<T> | undefined = undefined,
  Validate extends boolean = false
> {
  name?: string
  type: T
  isRequired: Required
  defaultValue: Default
  validateFn: Validate extends true ? ValidateFn<T, Required> : undefined

  default: Required extends true
    ? never
    : Default extends undefined
    ? (value: InferTypeBasic<T>) => Environment<T, true, InferTypeBasic<T>>
    : never

  required: Required extends true
    ? never
    : Default extends undefined
    ? () => Environment<T, true>
    : never

  validate: Validate extends true
    ? never
    : (fn: ValidateFn<T, Required>) => Environment<T, Required, Default, true>
}

export interface MonoEnvironment {
  name?: string
  type: Type
  isRequired: boolean
  defaultValue?: unknown
  validateFn: ((v: any) => void | undefined | string) | undefined
}

const createEnvironment: <T extends Type>(
  type: T
) => (name?: string) => Environment<T> = type => name => ({
  name,
  type,
  isRequired: false,

  // @ts-expect-error Type Shifting
  required() {
    // @ts-expect-error Type Shifting
    this.isRequired = true
    return this
  },

  // @ts-expect-error Type Shifting
  default(value) {
    // @ts-expect-error Type Shifting
    this.defaultValue = value

    return this
  },

  // @ts-expect-error Type Shifting
  validate(fn) {
    // @ts-expect-error Type Shifting
    this.validateFn = fn

    return this
  },
})

export const t = {
  string: createEnvironment(types.string),
  int: createEnvironment(types.int),
  float: createEnvironment(types.float),
  bool: createEnvironment(types.bool),
} as const
