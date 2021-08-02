import {
  defineComponent,
  registerElement,
  useState
} from 'lit-sugar';
import { html, css } from 'lit';
import type { C } from 'ts-toolbelt';

import type { NameChangedEvent, OpenChangedEvent } from './x-modal-editor';

import 'x-portal';
import './x-modal-editor';

export const XApp = defineComponent({
  styles: css`
    .container {
      box-sizing: border-box;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 50px 70px;
    }
  `,
  setup: (_, { host }) => {
    const [name, setName] = useState(host, 'Mr. Unknown');

    /** Number of letters of `name` */
    const numNameLetters = () => {
      return name().length;
    };

    const onNameChanged = (e: NameChangedEvent) => {
      setName(e.detail.name);
    };

    const [editing, setEditing] = useState(host, false);

    const onEditClicked = () => {
      setEditing(true);
    };

    const onOpenChanged = (e: OpenChangedEvent) => {
      setEditing(e.detail.open);
    };

    return () => {
      return html`
        <div class="container">
          <div>
            <span>My name is: <b>${name()}</b></span>
          </div>
          <div>
            <span>It has ${numNameLetters()} letters</span>
          </div>
          <button @click="${onEditClicked}">
            <span>Change name</span>
          </button>
        </div>
        <x-portal
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
    };
  }
});

declare global {
  interface HTMLElementTagNameMap {
    'x-app': C.Instance<typeof XApp>;
  }
}

registerElement('x-app', XApp);
