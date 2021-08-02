# x-portal

This component creates a portal to render content under another DOM element.

It doesn't not accept children. Instead, the component accepts a `template` property that will be rendered under the specified `target` (`document.body` by default).

## Example

```ts
html`
  <x-portal
    .target="${document.body}"
    ?disabled="${!editing()}"
    .template="${
      html`
        <x-modal-editor
          ?open="${editing()}"
          name="${name()}"
          @name-changed="${onNameChanged}"
          @open-changed="${onOpenChanged}">
        </x-modal-editor>
      `
    }">
  </x-portal>
`;
```
