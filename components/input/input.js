import { AdamElement } from '../AdamElement.js';

class AdamInput extends AdamElement {
	static get formAssociated() { return true; }
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
				{
					prop: 'type',
					validate: (value) => {
						if (!['text', 'email', 'url', 'tel', 'search', 'password'].includes(value)) {
							return 'text';
						}

						return value;
					}
				}
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
						aria-describedby="error-text"
					/>
					<div id="outer-border"></div>
					<div id="attention-marker"></div>
					<label for="{id}">
						{label}
						<small id="required-text">(required)</small>
					</label>
					<div id="info-box">
						<div id="info-text" tabindex="0">
							<slot name="helper-text"></slot>
						</div>
						<div id="error-text"></div>
					</div>
				</div>
			`
		});

		if (!this.id) {
			this.id = this.uniqueID;
		}
	}

	mounted() {
		this.#input = this.root.querySelector('input');

		if (!this.#input.checkValidity()) {
			this.root.querySelector('#error-text').innerText = this.#input.validationMessage;
		}

		this.#input.addEventListener('change', (evt) => {
			evt.target.checkValidity();

			this.internals.setFormValue(this.#input.value);
			this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
		});

		this.#input.addEventListener('invalid', (evt) => {
			evt.preventDefault();
			evt.stopPropagation();

			this.root.querySelector('#error-text').innerText = evt.target.validationMessage;

			this.internals.setValidity(this.#input.validity);
			this.dispatchEvent(new CustomEvent('invalid', { bubbles: true, composed: true }));
		});

		if (this.#input.type === 'password') {
			this.root.addEventListener('click', (evt) => {
				if (evt.target.matches('#outer-border')) {
					if (this.#input.hasAttribute('show-password')) {
						this.#input.removeAttribute('show-password');
						this.#input.type = 'password';
					} else {
						this.#input.setAttribute('show-password', true);
						this.#input.type = 'text';
					}
				}
			});
		}

		if (['tel', 'url', 'email'].includes(this.#input.type)) {
			this.root.addEventListener('click', (evt) => {
				if (evt.target.matches('#outer-border')) {
					const hasValue = evt.target.parentElement.querySelector('input').value !== '';
					const isValid = evt.target.parentElement.querySelector('input').checkValidity();

					if (hasValue && isValid) {
						let url = this.#input.value;

						switch (this.#input.type) {
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
			});
		}
	}
}

customElements.define('adam-input', AdamInput);
