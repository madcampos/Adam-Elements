import { AdamElement } from '../AdamElement/AdamElement';

import inputTemplate from './template.html?raw';
import inputStyle from './style.css?raw';

const watchedAttributes = ['id', 'label', 'required', 'readonly', 'disabled', 'value', 'autocomplete', 'pattern', 'maxlength', 'minlength', 'inputmode', 'type'];

export interface AdamInput {
	id: string,
	label: string,
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

export class AdamInput extends AdamElement {
	static observedAttributes = watchedAttributes;
	#input: HTMLInputElement;

	constructor() {
		super({
			name: 'adam-input',
			watchedAttributes,
			props: [
				{ name: 'id', value: `input-${AdamElement.uniqueID}`, attributeName: 'id' },
				{ name: 'label', value: '', attributeName: 'label' },
				{ name: 'required', value: false, attributeName: 'required' },
				{ name: 'readOnly', value: false, attributeName: 'readonly' },
				{ name: 'disabled', value: false, attributeName: 'disabled' },
				{ name: 'minLength', value: 0, attributeName: 'minlength' },
				{ name: 'maxLength', value: Number.MAX_SAFE_INTEGER, attributeName: 'maxlength' },
				{ name: 'autoComplete', value: 'off', attributeName: 'autocomplete' },
				{ name: 'pattern', value: '', attributeName: 'pattern' },
				{ name: 'inputMode', value: '', attributeName: 'inputmode' },
				{
					name: 'value',
					value: (value?: string) => {
						this.#input.value = value ?? '';

						if (!this.#input.checkValidity()) {
							const errorText = this.root.querySelector('#error-text') as HTMLDivElement;

							errorText.innerText = this.#input.validationMessage;
						}

						return this.#input.value;
					},
					attributeName: 'value'
				},
				{
					name: 'type',
					value: (value?: string) => {
						this.#input.type = value ?? 'text';

						return this.#input.type;
					},
					validate: (value) => {
						if (!['text', 'email', 'url', 'tel', 'search', 'password'].includes(value as string)) {
							throw new Error('Invalid input type');
						}
					},
					attributeName: 'type'
				}
			],
			handlers: {
				change: () => {
					this.#input.checkValidity();

					this.internals.setFormValue(this.#input.value);
					this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
				},
				invalid: (evt: Event) => {
					evt.preventDefault();
					evt.stopPropagation();

					const errorText = this.root.querySelector('#error-text') as HTMLDivElement;

					errorText.innerText = this.#input.validationMessage;

					// TODO: fix
					// This.internals.setValidity(this.#input.validity);
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
