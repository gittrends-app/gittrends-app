export type NonNullableFields<T> = Pick<T, { [K in keyof T]: T[K] extends NonNullable<T[K]> ? K : never }[keyof T]>;
export type NullableFields<T> = Pick<
  T,
  { [K in keyof T]: undefined extends T[K] ? K : T[K] extends null ? K : never }[keyof T]
>;
export type Booleanify<T> = Partial<Record<keyof T, boolean>>;
