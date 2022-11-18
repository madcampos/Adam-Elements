import { templateParser, type TemplateParser } from './serialization';

type PropPrimitiveTypes = boolean | string | number | object;

type ComputedPropHandler<T extends PropPrimitiveTypes> = (newValue?: T) => T | Promise<T>;

type PropTypes = PropPrimitiveTypes | ComputedPropHandler<PropPrimitiveTypes>;

export interface ComputedProp<T extends PropPrimitiveTypes> {
	update(newValue?: T): void,
	set(handler: ComputedPropHandler<T>): void
}

export type PropValidationHandler<T extends PropTypes> = (value: T) => boolean;

interface PropDefinition<T extends PropTypes> {
	name: string,
	value: T,
	validate?: PropValidationHandler<T>,
	attributeName?: string,
	selector?: string
}

type EventHandler = (evt: Event) => void | Promise<void>;

type Prop<T extends PropTypes> = Omit<PropDefinition<T>, 'selector'> & {
	boundAttributes: Record<string, HTMLElement>,
	boundElements: HTMLElement[]
};

type WatchedSlotEvent = Event & { target: HTMLSlotElement };

type WatchedSlotHandler = (evt: WatchedSlotEvent) => void;

type WatchedSlots = Record<string, WatchedSlotHandler>;

type ElementTemplate = string | HTMLTemplateElement;

type ElementStyle = string | CSSStyleSheet;

export interface CustomElementInterface {
	observedAttributes?: string[],
	connectedCallback?(): void | Promise<void>,
	disconnectedCallback?(): void | Promise<void>,
	adoptedCallback?(): void | Promise<void>,
	attributeChangedCallback?(name: string, oldValue: string, newValue: string): void | Promise<void>
}

interface AdamElementConstructor {
	name: string,
	watchedSlots?: WatchedSlots,
	props?: PropDefinition<PropTypes>[],
	watchedAttributes?: string[],
	template?: ElementTemplate,
	style?: ElementStyle,
	handlers?: Record<string, EventHandler>
}

export class AdamElement extends HTMLElement implements CustomElementInterface {
	#watchedSlots: WatchedSlots = {};
	#props = new Map<string, Prop<PropTypes>>();
	#watchedAttributes = new Map<string, string>();
	#root: ShadowRoot;
	#internals: ElementInternals;
	#elementId = 'NO ID';

	handlers: Record<string, EventHandler | undefined> = {};
	name = 'NO NAME';

	constructor({ name, template, watchedSlots, props, watchedAttributes, style, handlers }: AdamElementConstructor) {
		super();

		this.name = name;
		this.#elementId = `${this.name}-${AdamElement.uniqueID}`;
		this.#root = this.attachShadow({ mode: 'closed', delegatesFocus: true });
		this.#internals = this.attachInternals();

		const { props: parsedProps, template: parsedTemplate, handlers: parsedHandlers } = this.#parseTemplate(template);

		if ((typeof style === 'string' && style !== '') || style instanceof CSSStyleSheet) {
			this.addStyle(style);
		}

		this.#root.addEventListener('slotchange', (evt) => {
			if (evt.target instanceof HTMLSlotElement) {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				this.#watchedSlots[evt.target.name]?.(evt as WatchedSlotEvent);
			}
		});

		this.#root.appendChild(parsedTemplate);

		if (handlers) {
			Object.entries(handlers).forEach(([handlerName, handler]) => {
				this.handlers[handlerName] = handler.bind(this);
			});
		}

		for (const handler of parsedHandlers) {
			if (this.handlers[handler.handlerName] === undefined) {
				throw new Error(`Handler "${handler.handlerName}" is not defined in watched handlers`);
			}

			handler.boundElement.addEventListener(handler.eventName, (evt) => {
				void this.handlers[handler.handlerName]?.(evt);
			});
		}

		for (const prop of props ?? []) {
			this.watchProp(prop);
		}

		for (const prop of parsedProps) {
			if (!this.#props.has(prop.propName)) {
				throw new Error(`Prop "${prop.propName}" is not defined in watched props`);
			}

			if (!prop.boundAttribute) {
				this.#bindPropToInternalElement(prop.propName, prop.boundElement);
			} else {
				this.#bindPropToInternalAttribute(prop.propName, prop.boundAttribute, prop.boundElement);
			}
		}

		for (const attribute of watchedAttributes ?? []) {
			if (!this.#watchedAttributes.has(attribute)) {
				throw new Error(`Attribute "${attribute}" is not defined in props`);
			}
		}

		if (watchedSlots) {
			this.#watchedSlots = watchedSlots;
		}

		this.#props.forEach((prop) => {
			this.#updateProp(prop.name, prop.value, true);
		});
	}

	static get uniqueID() {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		return Math.trunc(Math.random() * 10000000).toString(16);
	}

	get elementId() {
		return this.#elementId;
	}

	get root() {
		return this.#root;
	}

	get internals() {
		return this.#internals;
	}

	#parseTemplate(template?: ElementTemplate) {
		const tempTemplate = document.createElement('template');

		if (typeof template === 'string') {
			tempTemplate.innerHTML = template;
		} else if (template instanceof HTMLTemplateElement) {
			tempTemplate.content.appendChild(template.content.cloneNode(true));
		} else {
			throw new TypeError('Template must be a string or HTMLTemplateElement');
		}

		if (tempTemplate.content.children.length === 0) {
			throw new Error('Template is empty');
		}

		if (tempTemplate.content.children[0] instanceof HTMLTemplateElement) {
			// eslint-disable-next-line prefer-destructuring
			const wrappedTemplate = tempTemplate.content.children[0];

			tempTemplate.content.removeChild(wrappedTemplate);

			[...wrappedTemplate.content.children].forEach((child) => {
				tempTemplate.content.appendChild(child);
			});
		}

		const domTree = tempTemplate.content.cloneNode(true) as DocumentFragment;

		const { props, handlers } = AdamElement.templateParser(domTree);

		return {
			template: domTree,
			props,
			handlers
		};
	}

	#parseValue(value: string | null, type: PropTypes) {
		let parsedValue: PropTypes;

		switch (type) {
			case 'number':
				parsedValue = Number.parseFloat(value ?? '0');
				break;
			case 'boolean':
				parsedValue = value !== null;
				break;
			case 'object':
				parsedValue = JSON.parse(value ?? '{}');
				break;
			default:
				parsedValue = value ?? '';
				break;
		}

		return parsedValue;
	}

	#serializePropToAttribute(attr: string, element: HTMLElement, value: PropTypes) {
		switch (typeof value) {
			case 'boolean':
				if (value) {
					element.setAttribute(attr, '');
				} else {
					element.removeAttribute(attr);
				}
				break;
			case 'object':
				element.setAttribute(attr, JSON.stringify(value));
				break;
			case 'function':
				element.setAttribute(attr, '[function]');
				break;
			default:
				element.setAttribute(attr, value.toString());
				break;
		}
	}

	#getPropValue(prop: string) {
		if (!this.#props.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		return this.#props.get(prop)?.value as PropPrimitiveTypes;
	}

	#getComputedPropValue<T extends PropPrimitiveTypes>(prop: string): ComputedProp<T> {
		if (!this.#props.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		return {
			update: (newValue: T) => this.#updateProp(prop, newValue),
			set: (handler: ComputedPropHandler<T>) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				this.#props.get(prop)!.value = handler;
			}
		};
	}

	#propagatePropUpdates<T extends PropTypes>(prop: Prop<T>, newValue: T) {
		prop.validate?.(newValue);

		Object.entries(prop.boundAttributes).forEach(([attr, boundElement]) => {
			this.#serializePropToAttribute(attr, boundElement, newValue);
		});

		prop.boundElements.forEach((boundElement) => {
			if (typeof newValue === 'object') {
				boundElement.textContent = JSON.stringify(newValue);
			} else if (typeof newValue === 'function') {
				boundElement.textContent = '[function]';
			} else {
				boundElement.textContent = newValue.toString();
			}
		});

		if (prop.attributeName) {
			this.#serializePropToAttribute(prop.attributeName, this, newValue);
		}
	}

	#updateProp(propName: string, value: PropTypes, forceUpdate = false) {
		if (this.#props.has(propName)) {
			const prop = this.#props.get(propName) as Prop<typeof value>;

			if (typeof prop.value === 'function') {
				(async () => {
					const computedValue = await (prop.value as ComputedPropHandler<typeof value>)(value);

					this.#propagatePropUpdates(prop, computedValue);
				})();
			} else if (prop.value !== value || forceUpdate) {
				this.#propagatePropUpdates(prop, value);

				prop.value = value;
			}
		}
	}

	#bindPropToInternalAttribute(prop: string, attributeName: string, element: HTMLElement) {
		if (!this.#props.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.#props.get(prop)!.boundAttributes[attributeName] = element;
	}

	#bindPropToInternalElement(prop: string, element: HTMLElement) {
		if (!this.#props.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		this.#props.get(prop)?.boundElements.push(element);
	}

	static templateParser: TemplateParser = (template) => templateParser(template);

	watchProp({ name, value, attributeName, validate, selector }: PropDefinition<PropTypes>) {
		if (!(name in this)) {
			this.#props.set(name, {
				name,
				value,
				boundAttributes: {},
				boundElements: [],
				validate,
				attributeName
			});

			if (attributeName) {
				this.#watchedAttributes.set(attributeName, name);
			}

			if (selector) {
				this.#root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
					this.#bindPropToInternalElement(name, element);
				});
			}

			if (typeof value === 'function') {
				Object.defineProperty(this, name, {
					configurable: false,
					enumerable: true,
					get(): typeof value {
						return this.#getComputedPropValue(name);
					}
				});
			} else {
				Object.defineProperty(this, name, {
					configurable: false,
					enumerable: true,
					get(): typeof value {
						return this.#getPropValue(name);
					},
					set(newValue: typeof value) {
						this.#updateProp(name, newValue);
					}
				});
			}
		}
	}

	addStyle(style: string | CSSStyleSheet) {
		if (typeof style === 'string') {
			const stylesheet = document.createElement('style');

			stylesheet.innerHTML = style;

			this.#root.insertBefore(stylesheet, this.#root.firstChild);
		} else {
			this.#root.adoptedStyleSheets = [...this.#root.adoptedStyleSheets, style];
		}
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue) {
			const propName = this.#watchedAttributes.get(name) ?? '';
			const prop = this.#props.get(propName);

			if (prop) {
				const propValue = this.#parseValue(newValue, typeof prop.value);

				this.#updateProp(prop.name, propValue);
			}
		}
	}
}
