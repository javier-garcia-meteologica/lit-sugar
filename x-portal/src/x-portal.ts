import { adoptStyles } from 'lit';
import type { TemplateResult, ReactiveElement } from 'lit';

import {
  defineComponent,
  onHostConnected,
  onHostDisconnected,
  useComputed,
  useObserver,
  useState
} from 'lit-sugar';

import type { Component } from 'lit-sugar';

type TargetOrFn = Element | undefined | (() => Element);

interface Props {
  /**
   * Element that hosts portal content
   *
   * @remarks
   * Defaults to `document.body`. If `null` then contents will render directly under the portal element
   */
  target?: TargetOrFn | null;

  /**
   * Disables rendering of portal contents
   */
  disabled?: boolean;

  /**
   * Time in milliseconds to wait before disabling disabling rendering of portal contents.
   *
   * @remarks
   * Useful for exit animations
   */
  disableDelay?: number;

  /*
   * Content to render under `target`
   */
  template?: TemplateResult;
}

/**
 * Creates a portal to `target`, encapsulating the content with a shadow root
 */
export const XPortal: Component<Props> = defineComponent<Props>({
  properties: {
    target: {},
    disabled: { type: Boolean, attribute: 'disabled' },
    disableDelay: { type: Number, attribute: 'disable-delay' },
    template: {}
  },
  createRenderRoot: ({ host }) => {
    // Lit-Element renders content under this `renderRoot`. Create a detached
    // element so that it can be mounted and moved to any `target` at will.

    /** Rendered content wrapper */
    const renderRootEl: Element = document.createElement('div');
    const renderRoot = renderRootEl.attachShadow({ mode: 'open' });
    adoptStyles(
      renderRoot,
      (host.constructor as typeof ReactiveElement).elementStyles
    );
    host.renderOptions.renderBefore ??= renderRoot.firstChild as ChildNode;

    return renderRoot;
  },
  setup: ({
    target,
    disabled,
    disableDelay,
    template
  }, { host }) => {
    const [disabling, setDisabling] = useState(host, false);

    const shouldRender = useComputed(host, ([disabledValue, disablingValue]) => {
      return !(disabledValue ?? false) || disablingValue;
    }, [disabled, disabling] as const);

    let lastDisableTimeout: unknown | undefined;

    useObserver(host, ([disabledValue], oldValues) => {
      const [oldDisabledVal] = oldValues ?? [];

      if (disabledValue ?? false) {
        // Exit transition, if enabled
        if (!(oldDisabledVal ?? false) && disableDelay() != null) {
          setDisabling(true);

          if (lastDisableTimeout != null) {
            // If an exit transition was already running, replace it
            clearTimeout(lastDisableTimeout as number);
            lastDisableTimeout = undefined;
          }

          // Exit transition
          lastDisableTimeout = setTimeout(() => {
            setDisabling(false);
            lastDisableTimeout = undefined;
          }, disableDelay());
        }
      } else {
        // Cancel exit transitions
        setDisabling(false);
      }
    }, [disabled] as const, { skipFirstRender: true });

    /** Returns the element that hosts the portal output */
    const targetEl = (): Element => {
      let configuredTargetValue = target();
      // If there is no `target` defined and `target` is NOT null, then use default target
      if (configuredTargetValue === undefined) {
        configuredTargetValue = document.body;
      }
      const resolvedTargetValue = typeof configuredTargetValue === 'function'
        ? configuredTargetValue()
        : configuredTargetValue;

      // Fallback to `host`
      return resolvedTargetValue ?? host;
    };

    onHostConnected(host, () => {
      // Attach portal output to DOM
      if (shouldRender()) {
        const targetElValue: Element = targetEl();

        // Even if it was already attached, it has to be re-attached. Modals and
        // overlays that were displayed recently should have higher priority.
        // Also, the target could have changed.
        host.renderRoot.parentNode?.removeChild(host.renderRoot);
        targetElValue.appendChild(host.renderRoot);
      }

      if (host.children.length > 0) {
        throw new Error('Portal should not have children, use template instead');
      }
    });

    onHostDisconnected(host, () => {
      // Remove portal output from DOM
      host.renderRoot.parentNode?.removeChild(host.renderRoot);
    });

    useObserver(host, ([shouldRenderValue]) => {
      // Even if it was already attached, it has to be re-attached. Modals and
      // overlays that were displayed recently should have higher priority.
      // Also, the target could have changed.
      host.renderRoot.parentNode?.removeChild(host.renderRoot);

      if (shouldRenderValue && host.isConnected) {
        const targetElValue: Element = targetEl();
        targetElValue.appendChild(host.renderRoot);
      }
    }, [shouldRender, target] as const);

    /*
     * Rendering
     */
    return () => {
      if (!shouldRender()) return;
      return template();
    };
  }
});

/**
 * Creates a portal to `target`, using the light DOM
 */
export class XPortalLightDom extends XPortal {
  createRenderRoot () {
    return document.createElement('div');
  }
}
