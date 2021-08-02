import {
  registerElement
} from 'lit-sugar';
import type { C } from 'ts-toolbelt';

import {
  XPortal,
  XPortalLightDom
} from './x-portal';

// Declare elements globally
declare global {
  interface HTMLElementTagNameMap {
    'x-portal': C.Instance<typeof XPortal>;
    'x-portal-light-dom': C.Instance<typeof XPortalLightDom>;
  }
}

// Register HTML tags globally
registerElement('x-portal', XPortal);
registerElement('x-portal-light-dom', XPortalLightDom);

export {
  XPortal,
  XPortalLightDom
};
