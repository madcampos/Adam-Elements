import { AdamElement } from '../AdamElement/AdamElement';

class AdamSelect extends AdamElement {
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	static get formAssociated() { return true; }
	static get observedAttributes() { return ['label', 'required', 'disabled', 'multiple', 'size', 'placeholder', 'value']; }
	#select: HTMLSelectElement;

	constructor() {
		super({
			name: 'adam-select',
			watchedProps: [
				{ prop: 'required', type: 'boolean', defaultValue: false },
				{ prop: 'disabled', type: 'boolean', defaultValue: false },
				{ prop: 'multiple', type: 'boolean', defaultValue: false },
				{ prop: 'size', type: 'number', defaultValue: 0 },
				{ prop: 'value', type: 'string', defaultValue: '' }
			],
			style: import.meta.url,
			template: `
				<div>
					<select id="{id}" name="{id}">
						<option selected disabled hidden>{placeholder}</option>
					</select>
					<div id="outer-border"></div>
					<div id="attention-marker"></div>
					<label for="{id}">
						{label}
						<small id="required-text">(required)</small>
					</label>
					<div id="info-box">
						<div id="info-text">
							<slot name="helper-text"></slot>
						</div>
						<div id="error-text"></div>
					</div>
					<div hidden>
						<slot></slot>
					</div>
				</div>
			`
		});

		this.root.addEventListener('slotchange', (evt) => {
			const target = evt.target as HTMLSlotElement;

			if (!target.name) {
				const optionList = [...target.assignedElements()].filter((option) => option instanceof HTMLOptGroupElement || option instanceof HTMLOptionElement);

				for (const option of optionList) {
					this.#select.add(option as HTMLOptionElement | HTMLOptGroupElement);
				}
			}
		});

		this.#select = this.root.querySelector('select') as HTMLSelectElement;
	}

	mounted() {
		if (!this.#select.checkValidity()) {
			// @ts-expect-error
			this.root.querySelector('#error-text')?.innerText = this.#select.validationMessage;
		}

		this.#select.addEventListener('change', (evt) => {
			const target = evt.target as HTMLSelectElement;

			target.checkValidity();

			this.internals.setFormValue(this.#select.value);
			this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
		});

		this.#select.addEventListener('invalid', (evt) => {
			evt.preventDefault();
			evt.stopPropagation();

			const errorText = this.root.querySelector('#error-text') as HTMLDivElement;
			const target = evt.target as HTMLSelectElement;

			errorText.innerText = target.validationMessage;

			this.internals.setValidity(this.#select.validity);
			this.dispatchEvent(new CustomEvent('invalid', { bubbles: true, composed: true }));
		});
	}
}

customElements.define('adam-select', AdamSelect);
