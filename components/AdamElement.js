export class AdamElement extends HTMLElement {
	#template;
	#templateId = AdamElement.uniqueID;
	#watchedSlots;
	#watchedProps = [];
	#bindProps;

	/** @type {DocumentFragment} */
	root;

	constructor({ name, template, watchedSlots, watchedProps, bindProps, style } = { name: 'NO NAME', watchedSlots: {}, watchedProps: [], bindProps: [] }) {
		super();

		this.name = name;
		this.root = this.attachShadow({ mode: 'closed', delegateFocus: true });

		this.#template = template;
		this.#bindProps = bindProps;
		this.#watchedSlots = watchedSlots;

		if (style) {
			this.addStyle(style);
		}

		this.root.addEventListener('slotchange', (evt) => {
			this.#watchedSlots[evt.target.name]?.(evt);
		});

		const observedAttributes = this.constructor.observedAttributes ?? [];

		for (const prop of observedAttributes) {
			this.watchProp({ prop });
		}

		for (const prop of watchedProps) {
			this.watchProp(prop);
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			const prop = this.#watchedProps.find((watchedProp) => watchedProp.prop.toLowerCase() === name.toLowerCase());

			if (prop) {
				let parsedValue = null;

				switch (typeof prop.type) {
					case 'number':
						parsedValue = Number.parseFloat(newValue);
						break;
					case 'boolean':
						parsedValue = newValue === 'true';
						break;
					case 'object':
						parsedValue = JSON.parse(newValue);
						break;
					default:
						parsedValue = newValue;
						break;
				}

				this[name] = parsedValue;
			}
		}
	}

	connectedCallback() {
		this.#renderTemplate(this.#template);
		this.#computeProps();

		this.mounted?.();
	}

	static get uniqueID() {
		// eslint-disable-next-line no-magic-numbers
		return `adam-${this.name?.replace('adam-', '')}-${Math.trunc(Math.random() * 10000000).toString(16)}`;
	}

	#renderTemplate() {
		// TODO: cache and two way binding
		let tempTemplate = document.createElement('template');

		if (typeof this.#template === 'string') {
			// eslint-disable-next-line prefer-named-capture-group
			const interpolatedTemplate = this.#template.replaceAll(/\{([a-z0-9]+?)\}/giu, (_match, prop) => this[prop] ?? '');

			tempTemplate.innerHTML = interpolatedTemplate;
		} else if (document.querySelector(this.#template)?.content) {
			tempTemplate = document.querySelector(this.#template);
		}

		const newTemplate = tempTemplate.content.cloneNode(true);

		newTemplate.id = this.#templateId;

		if (this.root.querySelector(`#${this.#templateId}`)) {
			this.root.removeChild(this.root.querySelector(`#${this.#templateId}`));
		}

		this.root.appendChild(newTemplate);
	}

	#computeProps() {
		for (const { prop, attr, validate } of this.#watchedProps) {
			this.#updateProp(attr, this[prop], validate);
		}
	}

	#updateProp(attr, value, validate) {
		// eslint-disable-next-line no-eq-null
		if (value != null) {
			let normalizedValue = value.toString();

			if (typeof value === 'object') {
				normalizedValue = JSON.stringify(value);
			}

			if (validate?.() ?? true) {
				this.setAttribute(attr, normalizedValue);
				this.root.querySelectorAll(this.#bindProps.join(', '))?.forEach((boundElement) => boundElement.setAttribute(attr, normalizedValue));
			}
		}
	}

	#parseProp(attr, type) {
		const value = this.getAttribute(attr);
		let parsedValue = null;

		switch (typeof type) {
			case 'number':
				parsedValue = Number.parseFloat(value);
				break;
			case 'boolean':
				parsedValue = this.hasAttribute(attr);
				break;
			case 'object':
				parsedValue = JSON.parse(value);
				break;
			default:
				parsedValue = value;
				break;
		}

		return parsedValue;
	}

	watchProp({ prop, type, defaultValue, attributeName, validate } = {}) {
		const attr = attributeName ?? prop.toLowerCase();

		let previousValue = defaultValue;

		if (this[prop]) {
			previousValue = this[prop];

			delete this[prop];
		}

		Object.defineProperty(this, prop, {
			configurable: true,
			enumerable: true,
			get() {
				return this.#parseProp(attr, type);
			},
			set(value) {
				this.#updateProp(attr, value, validate);
			}
		});

		if (previousValue) {
			this[prop] = previousValue;
		}

		this.#watchedProps.push({ prop, attr, type, validate });
	}

	addStyle(styleOrScriptURL) {
		const baseURL = new URL(styleOrScriptURL);

		const pathParts = baseURL.pathname.split('/');
		const file = pathParts.pop();

		const [fileName] = file.split('.');

		const newFileURL = [...pathParts, `${fileName}.css`].join('/');

		const style = document.createElement('style');

		style.textContent = ':host { display: none; }';
		this.root.insertBefore(style, this.root.firstChild);

		fetch(newFileURL).then((res) => res.text()).then((cssText) => {
			style.textContent = cssText;
		});
	}
}
