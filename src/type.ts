export const stringType = Symbol('string')
export const intType = Symbol('int')
export const floatType = Symbol('float')
export const boolType = Symbol('bool')

export type Type = (typeof typeSymbols)[keyof typeof typeSymbols]
export const typeSymbols = {
  string: stringType,
  int: intType,
  float: floatType,
  bool: boolType,
} as const

export interface Mappings {
  [typeSymbols.string]: string
  [typeSymbols.int]: number
  [typeSymbols.float]: number
  [typeSymbols.bool]: boolean
}

export type InferTypeBasic<T extends Type> = Mappings[T]
export type InferType<
  T extends Type,
  R extends boolean | undefined,
> = R extends true ? Mappings[T] : Mappings[T] | undefined

type ValidateFn<T extends Type, R extends boolean | undefined> = (
  value: InferType<T, R>,
) => string | undefined

interface Environment<
  T extends Type,
  Required extends boolean = false,
  Default extends InferTypeBasic<T> | undefined = undefined,
  Validate extends boolean = false,
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
  validateFn: ((v: unknown) => string | undefined) | undefined
}

const createEnvironment: <T extends Type>(
  type: T,
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

const types = {
  string: createEnvironment(typeSymbols.string),
  int: createEnvironment(typeSymbols.int),
  float: createEnvironment(typeSymbols.float),
  bool: createEnvironment(typeSymbols.bool),
} as const

export { types as t }
