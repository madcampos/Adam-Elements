type PropTypeNames = 'boolean' | 'string' | 'number' | 'object';

type PropTypes<T extends PropTypeNames> =
	T extends 'boolean' ? boolean
	: T extends 'string' ? string
	: T extends 'number' ? number
	: Object;

type PropValidationHandler<T extends PropTypeNames> = (value: PropTypes<T>) => boolean;

interface WatchedPropDefinition<T extends PropTypeNames = PropTypeNames> {
	prop: string,
	type: T,
	validate?: PropValidationHandler<T>,
	defaultValue: PropTypes<T>,
	attributeName?: string,
	selector?: string
}

interface PropBinding {
	propName: string,
	boundElement: HTMLElement,
	boundAttribute?: string
}

interface WatchedProp<T extends PropTypeNames> {
	propName: string,
	value: PropTypes<T>,
	propType: T,
	validate?: PropValidationHandler<T>,
	attributeName?: string,
	boundAttributes: Record<string, HTMLElement>,
	boundElements: HTMLElement[]
}

type WatchedSlotHandler = (evt: Event) => void;

type WatchedSlots = Record<string, WatchedSlotHandler>;

type ElementTemplate = string | HTMLTemplateElement;

type ElementStyle = string | CSSStyleSheet;

interface AdamElementConstructor {
	name: string,
	watchedSlots?: WatchedSlots,
	watchedProps?: WatchedPropDefinition[],
	watchedAttributes?: string[],
	template?: ElementTemplate,
	style?: ElementStyle,
	styleUrls?: string[]
}

export class AdamElement extends HTMLElement {
	#watchedSlots: WatchedSlots = {};
	#watchedProps = new Map<string, WatchedProp<PropTypeNames>>();
	#watchedAttributes = new Map<string, string>();
	#root: ShadowRoot;
	#internals: ElementInternals;
	#elementId = 'NO ID';

	name = 'NO NAME';

	constructor({ name, template, watchedSlots, watchedAttributes, watchedProps, style, styleUrls }: AdamElementConstructor) {
		super();

		this.name = name;
		this.#elementId = AdamElement.uniqueID;
		this.#root = this.attachShadow({ mode: 'closed', delegatesFocus: true });
		this.#internals = this.attachInternals();

		const { props, template: parsedTemplate } = this.#parseTemplate(template);

		if (styleUrls) {
			styleUrls.forEach((styleUrl) => this.addStyleURL(styleUrl));
		}

		if ((typeof style === 'string' && style !== '') || style instanceof CSSStyleSheet) {
			this.addStyle(style);
		}

		this.#root.appendChild(parsedTemplate.content.cloneNode(true));

		for (const prop of watchedProps ?? []) {
			this.watchProp(prop);
		}

		for (const prop of props) {
			if (!this.#watchedProps.has(prop.propName)) {
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

		this.#root.addEventListener('slotchange', (evt) => {
			if (evt.target instanceof HTMLSlotElement) {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				this.#watchedSlots[evt.target.name]?.(evt);
			}
		});
	}

	static get uniqueID() {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		return `adam-${Math.trunc(Math.random() * 10000000).toString(16)}`;
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

		const parsedProps = AdamElement.templateParser(tempTemplate);

		return {
			template: tempTemplate,
			props: parsedProps
		};
	}

	#parseValue(value: string | null, type: PropTypeNames) {
		let parsedValue: PropTypes<PropTypeNames>;

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

	#serializePropToAttribute<T extends PropTypeNames>(attr: string, type: T, value: PropTypes<T>) {
		switch (type) {
			case 'boolean':
				if (value === true) {
					this.setAttribute(attr, '');
				} else {
					this.removeAttribute(attr);
				}
				break;
			case 'object':
				this.setAttribute(attr, JSON.stringify(value));
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/no-base-to-string
				this.setAttribute(attr, value.toString());
				break;
		}
	}

	#getPropValue(prop: string) {
		if (!this.#watchedProps.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		return this.#watchedProps.get(prop)?.value;
	}

	#updateProp<T extends PropTypeNames>(propName: string, value: PropTypes<T>, forceUpdate = false) {
		if (this.#watchedProps.has(propName)) {
			const prop = this.#watchedProps.get(propName) as WatchedProp<T>;

			if (prop.value !== value || forceUpdate) {
				prop.validate?.(value);

				prop.value = value;

				// TODO: Update attribute, if exists
				// TODO: Update internal element, if exists
			}
		}
	}

	#renderTemplate() {
		// TODO: render template based on prop changes?
	}

	#bindPropToInternalAttribute(prop: string, attributeName: string, element: HTMLElement) {
		if (!this.#watchedProps.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.#watchedProps.get(prop)!.boundAttributes[attributeName] = element;
	}

	#bindPropToInternalElement(prop: string, element: HTMLElement) {
		if (!this.#watchedProps.has(prop)) {
			throw new Error(`Prop "${prop}" is not defined in watched props`);
		}

		this.#watchedProps.get(prop)?.boundElements.push(element);
	}

	static templateParser(template: HTMLTemplateElement) {
		const props: PropBinding[] = [];

		const processNode = (node: Node) => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const { attributes } = node as Element;

				for (const attribute of attributes) {
					if ((/^(?:a-on:|a-bind:|@|:)/giu).test(attribute.name)) {
						const attributeName = attribute.name.replace(/^(?:a-on:|a-bind:|@|:)/giu, '');
						const prop = attribute.value;

						props.push({
							propName: prop,
							boundElement: node as HTMLElement,
							boundAttribute: attributeName
						});
					}
				}
			}

			if (node.nodeType === Node.TEXT_NODE) {
				const propMatch = node.textContent?.matchAll(/\{\{([a-z][a-z0-9]+?)\}\}/giu) ?? [];

				for (const [, prop] of propMatch) {
					props.push({
						propName: prop,
						boundElement: node.parentElement as HTMLElement
					});
				}
			}

			if (node.hasChildNodes()) {
				node.childNodes.forEach((childNode) => {
					processNode(childNode);
				});
			}
		};

		processNode(template.content);

		return props;
	}

	watchProp({ prop, type, defaultValue, attributeName, validate, selector }: WatchedPropDefinition) {
		if (!(prop in this)) {
			this.#watchedProps.set(prop, {
				propName: prop,
				value: defaultValue,
				boundAttributes: [],
				boundElements: [],
				propType: type,
				validate,
				attributeName
			});

			if (attributeName) {
				this.#watchedAttributes.set(attributeName, prop);
			}

			if (selector) {
				this.#root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
					this.#bindPropToInternalElement(prop, element);
				});
			}

			Object.defineProperty(this, prop, {
				configurable: false,
				enumerable: true,
				get(): PropTypes<typeof type> {
					return this.#getPropValue(prop);
				},
				set(value: PropTypes<typeof type>) {
					this.#updateProp(prop, value);
				}
			});
		}
	}

	addStyleURL(url: string) {
		const stylesheet = document.createElement('link');

		stylesheet.rel = 'stylesheet';
		stylesheet.href = url;

		this.#root.insertBefore(stylesheet, this.#root.firstChild);
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
			const prop = this.#watchedProps.get(propName);

			if (prop) {
				const propValue = this.#parseValue(newValue, prop.propType);

				this.#updateProp(prop.propName, propValue);
			}
		}
	}

	connectedCallback() {
		// TODO: update all props
		this.#renderTemplate();
	}
}
