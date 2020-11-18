import { AdamElement } from '../AdamElement.js';

class AdamInput extends AdamElement {
	static get observedAttributes() { return ['label', 'required', 'readonly', 'disabled', 'value', 'autocomplete', 'pattern', 'maxlength', 'minlength', 'inputmode', 'type']; }
	#input;

	constructor() {
		super({
			name: 'adam-input',
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
				{ prop: 'readOnly', type: Boolean },
				{ prop: 'disabled', type: Boolean },
				{ prop: 'minLength', type: Number },
				{ prop: 'maxLength', type: Number },
				{ prop: 'value' },
				{ prop: 'autocomplete' },
				{ prop: 'pattern' },
				{ prop: 'inputmode' },
				{ prop: 'type', validate: (value) => ['text', 'email', 'url', 'search', 'password'].includes(value) }
			],
			bindProps: ['input'],
			style: import.meta.url,
			template: `
				<div>
					<input
						type="text"
						id="{id}"
						name="{id}"
						placeholder="{label}"
					/>
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
				</div>
			`
		});

		if (!this.id) {
			this.id = AdamElement.uniqueID;
		}
	}

	mounted() {
		this.#input = this.root.querySelector('input');

		if (!this.#input.checkValidity()) {
			this.root.querySelector('#error-text').innerText = this.#input.validationMessage;
		}

		this.#input.addEventListener('change', (evt) => {
			evt.target.checkValidity();
		});

		this.#input.addEventListener('invalid', (evt) => {
			evt.preventDefault();
			evt.stopPropagation();

			this.root.querySelector('#error-text').innerText = evt.target.validationMessage;
		});
	}
}

customElements.define('adam-input', AdamInput);
