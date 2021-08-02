import {
  defineComponent,
  registerElement,
  useState
} from 'lit-sugar';
import { html, css } from 'lit';
import { styleMap } from 'lit/directives/style-map';
import { live } from 'lit/directives/live';
import type { C } from 'ts-toolbelt';

export type NameChangedEvent = CustomEvent<{ name: string }>;
export type OpenChangedEvent = CustomEvent<{ open: boolean }>;

const createOpenChangedEvent = (options: CustomEventInit<OpenChangedEvent['detail']>) => {
  return new CustomEvent<OpenChangedEvent['detail']>('open-changed', options);
};

interface Props {
  /** Editor is open */
  open?: boolean;
  /** Name */
  name?: string;
  /** Disables closing on backdrop click */
  disableBackdropClose?: boolean;
}

export const XModalEditor = defineComponent<Props>({
  properties: {
    open: { type: Boolean },
    name: { type: String },
    disableBackdropClose: { type: Boolean }
  },
  styles: css`
    .backdrop {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .dialog {
      background-color: #fff;
      margin: auto;
      width: 50vw;
      display: flex;
      flex-direction: column;
    }

    .container {
      display: flex;
      flex-direction: column;
      padding: 10px;
      justify-content: space-between;
    }

    .times-changed {
      margin-top: 10px;
    }

    .bottom-bar {
      align-self: flex-end;
      display: flex;
      flex-direction: row;
      padding-top: 10px;
      padding-bottom: 10px;
      justify-content: flex-end;
    }
    .bottom-bar > * {
      margin-left: 10px;
      margin-right: 10px;
    }

    @media only screen and (max-width: 768px) {
      .dialog {
        width: 100vw;
      }
    }
  `,
  setup: ({
    open,
    name,
    disableBackdropClose
  }, { host }) => {
    const [timesChanged, setTimesChanged] = useState(host, 0);
    const onNameChanged = (e: Event) => {
      const newName = (e.target as HTMLInputElement).value;
      host.dispatchEvent(
        new CustomEvent<NameChangedEvent['detail']>('name-changed', {
          detail: { name: newName }
        })
      );
      setTimesChanged(timesChanged() + 1);
    };

    const onCloseClicked = () => {
      host.dispatchEvent(createOpenChangedEvent({ detail: { open: false } }));
    };

    const onBackdropClicked = (e: MouseEvent) => {
      if (
        !(disableBackdropClose?.() ?? false) &&
        e.target !== host.renderRoot.querySelector('.backdrop')
      ) return;

      host.dispatchEvent(createOpenChangedEvent({ detail: { open: false } }));
    };

    return () => {
      if (!(open() ?? false)) return;

      return html`
        <div class="backdrop" @click="${onBackdropClicked}">
          <div class="dialog">
            <div class="container">
              <input
                type="text"
                .value=${live(name() ?? '')}
                @input="${onNameChanged}" />
              <div
                class="times-changed"
                style="${styleMap({
                  ...(timesChanged() < 1 ? { display: 'none' } : undefined)
                })}">
                This is the ${timesChanged()} time that you edit the name
              </div>
            </div>
            <div class="bottom-bar">
              <button
                @click="${onCloseClicked}">
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      `;
    };
  }
});

declare global {
  interface HTMLElementTagNameMap {
    'x-modal-editor': C.Instance<typeof XModalEditor>;
  }
}

registerElement('x-modal-editor', XModalEditor);
