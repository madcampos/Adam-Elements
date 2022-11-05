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
	defaultValue?: PropTypes<T>,
	attributeName?: string,
	selector?: string
}

type PropBindingType = 'element' | 'attribute';

interface PropbindingBase<T extends PropBindingType> {
	propName: string,
	type: T,
	boundElement: HTMLElement
}

type PropBindingToElement = PropbindingBase<'element'>;

type PropbindingToattribute = PropbindingBase<'attribute'> & {
	attributeName: string
};

type PropBinding<T extends PropBindingType> = T extends 'element'
	? PropBindingToElement
	: PropbindingToattribute;

interface WatchedPropBase <T extends PropTypeNames> {
	propName: string,
	propType: T,
	validate?: PropValidationHandler<T>,
	defaultValue?: PropTypes<T>,
	attributeName?: string
}

type WatchedProp<T extends PropTypeNames, U extends PropBindingType | undefined> = U extends PropBindingType
	? WatchedPropBase<T> & {
		bindingType: U,
		boundElement: HTMLElement
	}
	: WatchedPropBase<T>;

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
	#watchedProps: WatchedProp<PropTypeNames, PropBindingType | undefined>[] = [];
	#root: DocumentFragment;
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

		for (const prop of props) {
			if (!watchedProps?.find((watchedProp) => watchedProp.prop === prop.propName)) {
				throw new Error(`Prop "${prop.propName}" is not defined in watched props`);
			}

			// TODO: watch prop
		}

		for (const attribute of watchedAttributes ?? []) {
			if (!watchedProps?.find(({ prop }) => prop === attribute)) {
				throw new Error(`Attribute "${attribute}" is not defined in props`);
			}

			// TODO: watch prop
		}

		for (const prop of watchedProps ?? []) {
			this.watchProp(prop);
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

	#parseTemplate(template?: ElementTemplate) {
		const tempTemplate = document.createElement('template');

		if (typeof template === 'string') {
			tempTemplate.innerHTML = template;
		} else if (template instanceof HTMLTemplateElement) {
			tempTemplate.content.appendChild(template.content.cloneNode(true));
		} else {
			throw new TypeError('Template must be a string or HTMLTemplateElement');
		}

		const parsedProps: PropBinding<PropBindingType>[] = [];
		const templateMatches = tempTemplate.innerHTML.matchAll(/\{([a-z][a-z0-9]+?)\}/giu);

		for (const match of templateMatches) {
			// TODO: parse props and push them to the parsed props array.
			// TODO: add special case for form elements
		}

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
		// TODO: implement
	}

	#updateProp<T extends PropTypeNames>(prop: string, value: T, attributeName?: string, validate?: PropValidationHandler<T>) {
		// TODO: implement
	}

	#renderTemplate() {
		// TODO: render template based on prop changes.
		// let tempTemplate = document.createElement('template');

		// if (typeof this.#template === 'string') {
		// 	const interpolatedTemplate = this.#template.replaceAll(/\{([a-z0-9]+?)\}/giu, (_match, prop) => this[prop] ?? '');

		// 	tempTemplate.innerHTML = interpolatedTemplate;
		// } else if (document.querySelector(this.#template)?.content) {
		// 	tempTemplate = document.querySelector(this.#template);
		// }

		// const newTemplate = tempTemplate.content.cloneNode(true);

		// newTemplate.id = this.#templateId;

		// if (this.#root.querySelector(`#${this.#templateId}`)) {
		// 	this.#root.removeChild(this.#root.querySelector(`#${this.#templateId}`));
		// }

		// this.#root.appendChild(newTemplate);
	}

	#bindPropToAttribute<T extends PropTypeNames>(prop: string, attributeName: string) {
		// TODO: implement
	}

	#bindPropToElement<T extends PropTypeNames>(prop: string, selector: string) {
		// TODO: implement
	}

	get elementId() {
		return this.#elementId;
	}

	watchProp({ prop, type, defaultValue, attributeName, validate }: WatchedPropDefinition) {
		if (!(prop in this)) {
			this.#watchedProps.push({ propName: prop, attributeName, propType: type, validate });

			Object.defineProperty(this, prop, {
				configurable: false,
				enumerable: true,
				get(): PropTypes<typeof type> {
					return this.#getPropValue(prop);
				},
				set(value: PropTypes<typeof type>) {
					this.#updateProp(prop, value, attributeName, validate);
				}
			});

			if (defaultValue !== undefined) {
				this[prop] = defaultValue;
			}
		}
	}

	addStyleURL(url: string) {
		// TODO: implement
	}

	addStyle(styleOrScriptURL) {
		// const baseURL = new URL(styleOrScriptURL);

		// const pathParts = baseURL.pathname.split('/');
		// const file = pathParts.pop();

		// const [fileName] = file.split('.');

		// const newFileURL = [...pathParts, `${fileName}.css`].join('/');

		// const style = document.createElement('style');

		// style.textContent = ':host { display: none; }';
		// this.#root.insertBefore(style, this.#root.firstChild);

		// void fetch(newFileURL).then((res) => res.text()).then((cssText) => {
		// 	style.textContent = cssText;
		// });
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue) {
			const prop = this.#watchedProps.find((watchedProp) => watchedProp.attributeName === name);

			if (prop) {
				this[prop.propName] = this.#parseValue(newValue, prop.propType);
			}
		}
	}

	connectedCallback() {
		// TODO: update all props
		this.#renderTemplate();
	}
}
