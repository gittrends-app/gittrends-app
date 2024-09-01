import { Class } from 'type-fest';

/**
 *  Fragment interface
 */
export interface Fragment<R = any> {
  readonly alias: string;
  readonly fragments: Fragment[];
  toString(): string;
  parse(data: any): R;
}

export interface FragmentFactory {
  create<R>(type: Class<Fragment<R>>): Fragment<R>;
}

/**
 *  Partial fragment factory
 */
export class BaseFragmentFactory implements FragmentFactory {
  constructor(private full = false) {}

  create<R>(Ref: Class<Fragment<R>>): Fragment<R> {
    return new Ref(Ref.name, { factory: this, full: this.full });
  }
}
