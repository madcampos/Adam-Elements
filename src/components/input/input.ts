import { AdamElement } from '../AdamElement/AdamElement';

class AdamInput extends AdamElement {
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	static get formAssociated() { return true; }
	static get observedAttributes() { return ['label', 'required', 'readonly', 'disabled', 'value', 'autocomplete', 'pattern', 'maxlength', 'minlength', 'inputmode', 'type']; }
	#input: HTMLInputElement;

	constructor() {
		super({
			name: 'adam-input',
			watchedProps: [
				{ prop: 'required', type: 'boolean', defaultValue: false },
				{ prop: 'readOnly', type: 'boolean', defaultValue: false },
				{ prop: 'disabled', type: 'boolean', defaultValue: false },
				{ prop: 'minLength', type: 'number', defaultValue: 0 },
				{ prop: 'maxLength', type: 'number', defaultValue: 524288 },
				{ prop: 'value', type: 'string', defaultValue: '' },
				{ prop: 'autocomplete', type: 'string', defaultValue: 'off' },
				{ prop: 'pattern', type: 'string', defaultValue: '' },
				{ prop: 'inputmode', type: 'string', defaultValue: '' },
				{
					prop: 'type',
					type: 'string',
					defaultValue: 'text',
					validate: (value) => {
						if (!['text', 'email', 'url', 'tel', 'search', 'password'].includes(value as string)) {
							return true;
						}

						return false;
					}
				}
			],
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

		this.#input = this.root.querySelector('input') as HTMLInputElement;
	}

	mounted() {
		if (!this.#input.checkValidity()) {
			// @ts-expect-error
			this.root.querySelector('#error-text')?.innerText = this.#input.validationMessage;
		}

		this.#input.addEventListener('change', (evt) => {
			const target = evt.target as HTMLInputElement;

			target.checkValidity();

			this.internals.setFormValue(this.#input.value);
			this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
		});

		this.#input.addEventListener('invalid', (evt) => {
			evt.preventDefault();
			evt.stopPropagation();

			// @ts-expect-error
			this.root.querySelector('#error-text')?.innerText = evt.target.validationMessage;

			this.internals.setValidity(this.#input.validity);
			this.dispatchEvent(new CustomEvent('invalid', { bubbles: true, composed: true }));
		});

		if (this.#input.type === 'password') {
			this.root.addEventListener('click', (evt) => {
				const target = evt.target as HTMLElement;

				if (target.matches('#outer-border')) {
					if (this.#input.hasAttribute('show-password')) {
						this.#input.removeAttribute('show-password');
						this.#input.type = 'password';
					} else {
						this.#input.setAttribute('show-password', '');
						this.#input.type = 'text';
					}
				}
			});
		}

		if (['tel', 'url', 'email'].includes(this.#input.type)) {
			this.root.addEventListener('click', (evt) => {
				const target = evt.target as HTMLElement;

				if (target.matches('#outer-border')) {
					const hasValue = target.parentElement?.querySelector('input')?.value !== '';
					const isValid = target.parentElement?.querySelector('input')?.checkValidity();

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
