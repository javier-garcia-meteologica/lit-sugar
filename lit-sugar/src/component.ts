import { LitElement, noChange } from 'lit';
import type {
  TemplateResult,
  PropertyDeclaration,
  PropertyDeclarations,
  CSSResultGroup
} from 'lit';
import type { A, C } from 'ts-toolbelt';
import type {
  ReactiveGetter
} from './controllers';

/**
 * Component class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Component<Props extends object> = typeof LitElement & C.Class<any[], Props>;

/**
 * Component instance
 */
export type ComponentInstance<Props extends object> = LitElement & Props;

/**
 * Properties declaration for a given host
 */
type PropsDeclaration <Props extends object> = {
  [key in keyof Props]-?: PropertyDeclaration<Props[key]>
};

/**
 * Property accessors for a given host
 */
type PropsAccesors <Props extends object> = {
  [key in keyof Props]-?: ReactiveGetter<Props[key]>
};

/**
 * Creates property accessors for a given host and properties declaration
 */
const createPropsAccessors = <Props extends object>(
  host: Props,
  propsDeclaration: PropsDeclaration<Props>
): PropsAccesors<Props> => {
  const partialPropsAccessors: Partial<PropsAccesors<Props>> = {};

  for (const propKey of Object.keys(propsDeclaration) as Array<keyof typeof host>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const getter: ReactiveGetter<Props[typeof propKey]> = () => host[propKey];
    partialPropsAccessors[propKey] = getter;
  }

  return partialPropsAccessors as PropsAccesors<Props>;
};

interface CreateRenderRootFnConfig <Props extends object> {
  host: ComponentInstance<Props>;
}

export type CreateRenderRootFn <Props extends object> = (config: CreateRenderRootFnConfig<Props>) => Element | ShadowRoot;

interface Context <Props extends object> {
  host: ComponentInstance<Props>;
}

/**
 * Function to setup internal properties, internal functions and rendering of a Component
 */
export type SetupFn <Props extends object> = (
  propsAccessors: PropsAccesors<Props>,
  context: Context<Props>
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => ((() => TemplateResult | void) | void);

/**
 * Configuration to define a component class
 */
interface DefineComponentConfigBase <Props extends object> {
  /*
   * Properties definition and static methods
   */
  properties?: undefined | PropsDeclaration<Props>;
  styles?: CSSResultGroup;
  shadowRootOptions?: ShadowRootInit;
  // This is a special instance method. It creates the renderRoot and is only called once
  createRenderRoot?: CreateRenderRootFn<Props>;

  /**
   * Sets up internal properties, internal functions and rendering. Similar to `constructor`
   */
  setup: SetupFn<Props>;
}

interface DefineComponentConfigWithProps <Props extends object> extends DefineComponentConfigBase <Props> {
  properties: PropsDeclaration<Props>;
}

/**
 * Configuration to define a component class
 */
export type DefineComponentConfig <Props extends object> = A.Equals<Props, object> extends 1
  ? DefineComponentConfigBase<Props>
  : DefineComponentConfigWithProps<Props>;

/**
 * Defines a component class
 */
export const defineComponent = <Props extends object> (
  {
    properties,
    shadowRootOptions,
    styles,
    createRenderRoot,
    setup
  }: DefineComponentConfig<Props>
): Component<Props> => {
  const ComponentClass = class extends LitElement {
    static get properties () {
      if (!properties) return {};
      return properties as PropertyDeclarations;
    }

    static get styles () {
      return styles;
    }

    /**
     * Render function
     */
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    private readonly _renderFn: (() => TemplateResult | void) | void;

    constructor () {
      super();

      const propsAccessors: PropsAccesors<Props> = properties
        ? createPropsAccessors(
          this as LitElement as LitElement & Props,
          properties
        )
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        : {} as PropsAccesors<Props>;

      const host = this as ComponentInstance<object> as ComponentInstance<Props>;
      this._renderFn = setup(propsAccessors, { host });
    }

    protected createRenderRoot () {
      if (createRenderRoot) {
        const host = this as ComponentInstance<object> as ComponentInstance<Props>;
        return createRenderRoot({ host });
      }
      return super.createRenderRoot();
    }

    render () {
      if (!this._renderFn) return noChange;
      return this._renderFn();
    }
  } as Component<object> as Component<Props>;

  if (shadowRootOptions) {
    ComponentClass.shadowRootOptions = shadowRootOptions;
  }

  return ComponentClass;
};
