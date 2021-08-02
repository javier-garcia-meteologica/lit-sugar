# Lit sugar

This proposal aims to make Lit components easier to build and maintain.

## Principles

  - Avoid the use of decorators. They are not statically analyzable and overriding decorated properties on inherited components can be counterintutive.
  - Favor composition over inheritance, it's easier to reason about as the number and size of components increases.
  - Encourage reactive patterns: **immutable** props down - events up.
  - Grant the developer greater freedom to structure the component. Liberate the developer from having to structure the code around lifecycle methods. Make private instance properties unnecessary.

## Tools

LitElement 3 already provides most of the building blocks needed to build components according to the principles stated above. Lit offers these building blocks and many more possibilities. Unfortunately, these other possibilities can confuse junior developers and they end up writing bad code.

[lit-sugar tools](./lit-sugar) create a layer on top of LitElement that makes it easier to develop components following the principles above. For the very few cases that require more fine grained access to LitElement internals (1% of components), developers can still use the LitElement class to create such components.

## Examples

The following projects demonstrate how to create libraries and applications using these tools.

  - [x-portal](./x-portal). This component creates a portal to render content under another DOM element. Built with [lit-sugar tools](./lit-sugar)
  - [Application example](./example). Example of an application built with [lit-sugar tools](./lit-sugar).

## Running the examples

First make sure that `pnpm` is installed.

```bash
npm install -g pnpm
```

Then build the packages and run the example.

```bash
pnpm i
pnpm run build:all
pnpm run -r --filter=example start
```
