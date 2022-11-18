import { AdamElement } from '../AdamElement/AdamElement';

import inputTemplate from './template.html?raw';
import inputStyle from './style.css?raw';

const watchedAttributes = ['label', 'required', 'readonly', 'disabled', 'value', 'autocomplete', 'pattern', 'maxlength', 'minlength', 'inputmode', 'type'];

interface AdamInput {
	required: boolean,
	readonly: boolean,
	disabled: boolean,
	minlength: number,
	maxlength: number,
	pattern: string,
	autocomplete: string,
	inputmode: string,
	type: string,
	value: string
}

class AdamInput extends AdamElement {
	static observedAttributes = watchedAttributes;
	#input: HTMLInputElement;

	constructor() {
		super({
			name: 'adam-input',
			props: [
				{ name: 'required', value: false },
				{ name: 'readonly', value: false },
				{ name: 'disabled', value: false },
				{ name: 'minlength', value: 0 },
				{ name: 'maxlength', value: 524288 },
				{ name: 'autocomplete', value: 'off' },
				{ name: 'pattern', value: '' },
				{ name: 'inputmode', value: '' },
				{
					name: 'value',
					value: (value?: string) => {
						this.#input.value = value ?? '';

						if (!this.#input.checkValidity()) {
							// @ts-expect-error
							this.root.querySelector('#error-text')?.innerText = this.#input.validationMessage;
						}

						return this.#input.value;
					}
				},
				{
					name: 'type',
					value: (value?: string) => {
						this.#input.type = value ?? 'text';

						return this.#input.type;
					},
					validate: (value) => {
						if (!['text', 'email', 'url', 'tel', 'search', 'password'].includes(value as string)) {
							return true;
						}

						return false;
					}
				}
			],
			handlers: {
				change: (evt: Event) => {
					const target = evt.target as HTMLInputElement;

					target.checkValidity();

					this.internals.setFormValue(this.#input.value);
					this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
				},
				invalid: (evt: Event) => {
					evt.preventDefault();
					evt.stopPropagation();

					// @ts-expect-error
					this.root.querySelector('#error-text').innerText = evt.target.validationMessage;

					this.internals.setValidity(this.#input.validity);
					this.dispatchEvent(new CustomEvent('invalid', { bubbles: true, composed: true }));
				},
				handleIcons: (evt: Event) => {
					const target = evt.target as HTMLElement;

					if (target.matches('#outer-border')) {
						if (this.type === 'password') {
								if (this.#input.hasAttribute('show-password')) {
									this.#input.removeAttribute('show-password');
									this.#input.type = 'password';
								} else {
									this.#input.setAttribute('show-password', '');
									this.#input.type = 'text';
								}
						} else if (['tel', 'url', 'email'].includes(this.type)) {
							const hasValue = this.value !== '';
							const isValid = target.parentElement?.querySelector('input')?.checkValidity();

							if (hasValue && isValid) {
								let url = this.value;

								switch (this.type) {
									case 'tel':
										url = `tel:${this.value}`;
										break;
									case 'email':
										url = `mailto:${this.value}`;
										break;
									default:
										url = this.#input.value;
								}

								window.open(url);
							}
						}
					}
				}
			},
			style: inputStyle,
			template: inputTemplate
		});

		this.#input = this.root.querySelector('input') as HTMLInputElement;
	}
}

customElements.define('adam-input', AdamInput);
