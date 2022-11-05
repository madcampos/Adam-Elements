import { AdamElement } from '../AdamElement.js';

class AdamSelect extends AdamElement {
	static get formAssociated() { return true; }
	static get observedAttributes() { return ['label', 'required', 'disabled', 'multiple', 'size', 'placeholder', 'value']; }
	#select;

	constructor() {
		super({
			name: 'adam-select',
			watchedSlots: {
				'helper-text': (evt) => {
					if (evt.target.assignedElements().length === 0) {
						evt.target.parentElement.style.display = 'none';
					} else {
						evt.target.parentElement.style.display = 'block';
					}
				}
			},
			watchedProps: [
				{ prop: 'required', type: Boolean },
				{ prop: 'disabled', type: Boolean },
				{ prop: 'multiple', type: Boolean },
				{ prop: 'size', type: Boolean },
				{ prop: 'value' }
			],
			bindProps: ['select'],
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

		if (!this.id) {
			this.id = this.uniqueID;
		}

		if (!this.placeholder) {
			this.placeholder = '...';
		}

		this.#root.addEventListener('slotchange', (evt) => {
			if (!evt.target.name) {
				const optionList = [...evt.target.assignedElements()].filter((el) => el instanceof HTMLOptGroupElement || el instanceof HTMLOptionElement);

				for (const option of optionList) {
					this.#select.add(option);
				}
			}
		});
	}

	mounted() {
		this.#select = this.#root.querySelector('select');

		if (!this.#select.checkValidity()) {
			this.#root.querySelector('#error-text').innerText = this.#select.validationMessage;
		}

		this.#select.addEventListener('change', (evt) => {
			evt.target.checkValidity();

			this.#internals.setFormValue(this.#select.value);
			this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
		});

		this.#select.addEventListener('invalid', (evt) => {
			evt.preventDefault();
			evt.stopPropagation();

			this.#root.querySelector('#error-text').innerText = evt.target.validationMessage;

			this.#internals.setValidity(this.#select.validity);
			this.dispatchEvent(new CustomEvent('invalid', { bubbles: true, composed: true }));
		});
	}
}

customElements.define('adam-select', AdamSelect);
