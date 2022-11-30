import { AdamElement, type ComputedPropValue } from '../AdamElement/AdamElement';

import inputTemplate from './template.html?raw';
import inputStyle from './style.css?raw';
import { setBorders } from '../AdamElement/borders';

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
				{
					name: 'required',
					value: (newValue?: ComputedPropValue<boolean>) => {
						const value = typeof newValue === 'string' ? true : newValue ?? false;

						this.#input.required = value;
						this.#input.classList.toggle('has-validation', value);

						return value;
					},
					attributeName: 'required'
				},
				{ name: 'readOnly', value: false, attributeName: 'readonly' },
				{ name: 'disabled', value: false, attributeName: 'disabled' },
				{
					name: 'minLength',
					value: (newValue?: ComputedPropValue<number>) => {
						const value = Number.parseInt((newValue ?? 0).toString());

						this.#input.minLength = value;
						this.#input.classList.toggle('has-validation', value > 0);

						return value;
					},
					attributeName: 'minlength'
				},
				{
					name: 'maxLength',
					value: (newValue?: ComputedPropValue<number>) => {
						const value = Number.parseInt((newValue ?? Number.MAX_SAFE_INTEGER).toString());

						this.#input.maxLength = value;
						this.#input.classList.toggle('has-validation', value < Number.MAX_SAFE_INTEGER);

						return value;
					},
					attributeName: 'maxlength'
				},
				{ name: 'autoComplete', value: 'off', attributeName: 'autocomplete' },
				{
					name: 'pattern',
					value: (newValue?: ComputedPropValue<string>) => {
						const value = newValue ?? '';

						this.#input.pattern = value;
						this.#input.classList.toggle('has-validation', value !== '');

						return value;
					},
					attributeName: 'pattern'
				},
				{ name: 'inputMode', value: '', attributeName: 'inputmode' },
				{
					name: 'value',
					value: (value?: ComputedPropValue<string>) => {
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
					value: (newValue?: ComputedPropValue<string>) => {
						const value = newValue ?? 'text';

						this.#input.type = value;
						this.#input.classList.toggle('has-validation', value === 'email' || value === 'url');

						return value;
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

					this.internals?.setFormValue(this.#input.value);
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
				handleIcons: (evt) => {
					evt.preventDefault();
					evt.stopPropagation();

					if (this.type === 'password') {
							if (this.#input.hasAttribute('show-password')) {
								this.#input.removeAttribute('show-password');
								this.#input.type = 'password';
							} else {
								this.#input.setAttribute('show-password', '');
								this.#input.type = 'text';
							}
					} else if (['tel', 'url', 'email'].includes(this.type)) {
						const hasValue = this.#input.value !== '';
						const isValid = this.#input.checkValidity();

						if (hasValue && isValid) {
							let url = this.#input.value;

							switch (this.type) {
								case 'tel':
									url = `tel:${this.#input.value}`;
									break;
								case 'email':
									url = `mailto:${this.#input.value}`;
									break;
								default:
									url = this.#input.value;
							}

							window.open(url);
						}
					}
				}
			},
			watchedSlots: {
				'helper-text': (evt) => {
					const elementsCount = evt.target.assignedElements().length;

					this.root.querySelector('#root')?.classList.toggle('has-helper-text', elementsCount > 0);
				}
			},
			style: inputStyle,
			template: inputTemplate
		});

		this.#input = this.root.querySelector('input') as HTMLInputElement;

		const resizeObserver = new ResizeObserver((entries) => {
			const rootStyle = getComputedStyle(this.root.querySelector('#borders-svg') as HTMLDivElement, '::before');
			const { top, right, bottom, left } = entries[0].contentRect;

			const radius = Number.parseFloat(rootStyle.getPropertyValue('border-radius'));
			const stroke = Number.parseFloat(rootStyle.getPropertyValue('border-width'));
			const spacing = Number.parseFloat(rootStyle.getPropertyValue('margin'));

			setBorders(this.root, { top, right, bottom, left, stroke, radius, spacing });
		});

		resizeObserver.observe(this.root.querySelector('#borders-svg') as HTMLDivElement);
	}
}

customElements.define('adam-input', AdamInput);
