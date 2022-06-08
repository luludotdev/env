export class ParseError extends TypeError {
  public readonly type: string

  constructor(type: string) {
    super()
    this.type = type
  }
}

type ParseFn<T> = (value: string) => T

const trueValues = new Set(['true', 't', '1', 'yes', 'y'])
const falseValues = new Set(['false', 'f', '0', 'no', 'n'])

export const parseBool: ParseFn<boolean> = value => {
  const isTrue = trueValues.has(value.toLowerCase())
  const isFalse = falseValues.has(value.toLowerCase())

  if (isTrue) return true
  if (isFalse) return false

  throw new ParseError('bool')
}

export const parseInt: ParseFn<number> = value => {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new ParseError('int')
  }

  return parsed
}

export const parseFloat: ParseFn<number> = value => {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    throw new ParseError('float')
  }

  return parsed
}
