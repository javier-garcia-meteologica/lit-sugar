import type { C } from 'ts-toolbelt';

/**
 * Register a custom element tag
 *
 * @remarks
 * Type-safe version of `customElements.define`
 */
export const registerElement = <
  Name extends keyof HTMLElementTagNameMap
>(
  name: Name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor: C.Class<any[], HTMLElement & HTMLElementTagNameMap[Name]>,
  options?: ElementDefinitionOptions
): void => {
  customElements.define(name, constructor, options);
};
