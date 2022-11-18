import selectTemplate from './select.html?raw';
import selectStyle from './select.css?raw';

import { AdamElement } from '../AdamElement/AdamElement';

const watchedAttributes = ['label', 'required', 'disabled', 'multiple', 'size', 'value'];

interface AdamSelect {
	required: boolean,
	disabled: boolean,
	multiple: boolean,
	size: number,
	value: string
}

class AdamSelect extends AdamElement {
	static observedAttributes = watchedAttributes;
	#select: HTMLSelectElement;

	constructor() {
		super({
			name: 'adam-select',
			props: [
				{ name: 'required', value: false },
				{ name: 'disabled', value: false },
				{ name: 'multiple', value: false },
				{ name: 'size', value: 0 },
				{
					name: 'value',
					value: (value?: string) => {
						this.#select.value = value ?? '';

						if (!this.#select.checkValidity()) {
							// @ts-expect-error
							this.root.querySelector('#error-text')?.innerText = this.#select.validationMessage;
						}

						return this.#select.value;
					}
				}
			],
			style: selectStyle,
			template: selectTemplate,
			watchedAttributes,
			watchedSlots: {
				'default': (evt) => {
					const target = evt.target as HTMLSlotElement;
					const optionList = [...target.assignedElements()].filter((option) => option instanceof HTMLOptGroupElement || option instanceof HTMLOptionElement);

					for (const option of optionList) {
						this.#select.add(option as HTMLOptionElement | HTMLOptGroupElement);
					}
				}
			},
			handlers: {
				change: (evt: Event) => {
					const target = evt.target as HTMLSelectElement;

					target.checkValidity();

					this.internals.setFormValue(target.value);
					this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
				},
				invalid: (evt: Event) => {
					evt.preventDefault();
					evt.stopPropagation();

					const errorText = this.root.querySelector('#error-text') as HTMLDivElement;
					const target = evt.target as HTMLSelectElement;

					errorText.innerText = target.validationMessage;

					this.internals.setValidity(this.#select.validity);
					this.dispatchEvent(new CustomEvent('invalid', { bubbles: true, composed: true }));
				}
			}
		});

		this.#select = this.root.querySelector('select') as HTMLSelectElement;
	}
}

customElements.define('adam-select', AdamSelect);
