import { VALID_EMOJIS } from '../apis/notion';

import { NullIfEmpty, NeverEmpty } from './';

import { Button } from '../elements';

type TypeGuard = (value: unknown) => boolean;

const enum SaveButtonUpdates {
	Pending,
	Disable,
	Restore,
}

const SaveButton: {
	button?: Button;
	updateState(update: SaveButtonUpdates): void;
} = <const>{
	get button() {
		try {
			delete this.button;
			return this.button = Button.getInstance('save-button');
		}
		catch { null; }
	},
	updateState(update: SaveButtonUpdates): void {
		if (!this.button) return;
		switch (update) {
			case SaveButtonUpdates.Pending:
				this.button.setButtonLabel(`Validating ${InputFieldValidator.countValidatingFields()} input${(InputFieldValidator.countValidatingFields() > 1) ? 's' : ''}...`);
				this.button.disable();
				break;
			case SaveButtonUpdates.Disable:
				this.button.setButtonLabel(`${InputFieldValidator.countInvalidFields()} invalid input${(InputFieldValidator.countInvalidFields() > 1) ? 's' : ''}!`);
				this.button.disable();
				this.button.addClass('red');
				this.button.removeClass('green');
				break;
			case SaveButtonUpdates.Restore:
				if (InputFieldValidator.countInvalidFields() > 0) return this.updateState(SaveButtonUpdates.Disable);
				else if (InputFieldValidator.countValidatingFields() > 0) return this.updateState(SaveButtonUpdates.Pending);

				this.button.resetHTML();
				this.button.enable();
				break;
		}
	},
};

export abstract class InputFieldValidator {
	public static readonly INVALID_INPUT: unique symbol = Symbol('INVALID_INPUT');
	private static validatingFields = new Set<string>();
	private static invalidFields = new Set<string>();

	protected elementId: string;
	protected typeGuard: TypeGuard;
	protected typeLabel: string;

	private fieldElement: HTMLElement;

	public constructor(elementId: string, typeGuard: TypeGuard, typeLabel: string) {
		this.elementId = elementId;
		this.typeGuard = typeGuard;
		this.typeLabel = typeLabel;

		const fieldElement = document.getElementById(elementId);
		if (!fieldElement) throw new Error(`Failed to get element ${elementId}.`);

		this.fieldElement = fieldElement;
	}

	public static countValidatingFields(): number {
		return InputFieldValidator.validatingFields.size;
	}

	public static countInvalidFields(): number {
		return InputFieldValidator.invalidFields.size;
	}

	protected async validator(inputValue: NullIfEmpty<string>): Promise<NullIfEmpty<string> | typeof InputFieldValidator.INVALID_INPUT> {
		if (this.typeGuard(inputValue)) return inputValue;
		else {
			this.addInvalidError(`Input must be a ${this.typeLabel}!`);
			return InputFieldValidator.INVALID_INPUT;
		}
	}

	public async validate(inputValue: NullIfEmpty<string>): Promise<NullIfEmpty<string> | typeof InputFieldValidator.INVALID_INPUT> {
		this.addValidatingStatus();
		const validatedInput = await this.validator(inputValue);
		this.removeValidatingStatus();

		if (validatedInput !== InputFieldValidator.INVALID_INPUT) this.removeInvalidError();

		return validatedInput;
	}

	protected addValidatingStatus() {
		this.removeInvalidError();

		InputFieldValidator.validatingFields.add(this.elementId);

		const status = 'Validating input...';

		const statusElement = document.getElementById(`validating-input-${this.elementId}`);
		const statusHTML = `<span id='validating-input-${this.elementId}' class='validating-input-status'>${status}</span>`;

		if (!statusElement) this.fieldElement.insertAdjacentHTML('beforebegin', statusHTML);
		else statusElement.innerHTML = status;

		SaveButton.updateState(SaveButtonUpdates.Pending);
	}

	private removeValidatingStatus() {
		InputFieldValidator.validatingFields.delete(this.elementId);

		document.getElementById(`validating-input-${this.elementId}`)?.remove();

		SaveButton.updateState(SaveButtonUpdates.Restore);
	}

	protected addInvalidError(error: string) {
		InputFieldValidator.invalidFields.add(this.elementId);

		this.fieldElement.classList.add('invalid-input');

		const errorElement = document.getElementById(`invalid-input-${this.elementId}`);
		const errorHTML = `<span id='invalid-input-${this.elementId}' class='invalid-input-error'>${error}</span>`;

		if (!errorElement) this.fieldElement.insertAdjacentHTML('beforebegin', errorHTML);
		else errorElement.innerHTML = error;

		SaveButton.updateState(SaveButtonUpdates.Disable);
	}

	private removeInvalidError() {
		InputFieldValidator.invalidFields.delete(this.elementId);

		document.getElementById(this.elementId)?.classList.remove('invalid-input');
		document.getElementById(`invalid-input-${this.elementId}`)?.remove();

		SaveButton.updateState(SaveButtonUpdates.Restore);
	}
}

abstract class RequiredField extends InputFieldValidator {
	protected override async validator(inputValue: NullIfEmpty<string>): Promise<NeverEmpty<string> | typeof InputFieldValidator.INVALID_INPUT> {
		if (inputValue) {
			if (this.typeGuard(inputValue)) return inputValue;
			else this.addInvalidError(`Input must be a ${this.typeLabel}!`);
		}
		else this.addInvalidError('Required field cannot be empty!');

		return InputFieldValidator.INVALID_INPUT;
	}
}

abstract class RequiredFieldCache extends RequiredField {
	protected static cache: Record<string, NeverEmpty<string>> = {};

	public getCachedInput(): NeverEmpty<string> | undefined {
		return RequiredFieldCache.cache?.[this.elementId];
	}

	protected cacheInput<T extends NeverEmpty<string>>(inputValue: T): T {
		return RequiredFieldCache.cache[this.elementId] = inputValue;
	}
}

abstract class JSONObjectField extends InputFieldValidator {
	protected override async validator(inputValue: NullIfEmpty<string>): Promise<NeverEmpty<string> | '{}' | typeof InputFieldValidator.INVALID_INPUT> {
		try {
			if (!inputValue) return '{}';

			const parsed = JSON.parse(inputValue);

			// JSON can't serialise any non-primitives other than 'objects' and arrays, so this will do
			if (parsed instanceof Object && !Array.isArray(parsed)) {
				if (Object.values(parsed).every(this.typeGuard)) {
					document.getElementById(this.elementId)?.classList?.remove('invalid-input');
					return inputValue;
				}
				else this.addInvalidError(`All object values must be ${this.typeLabel}s!`);
			}
			else this.addInvalidError('Input must be an object <code>{}</code>.');

			return InputFieldValidator.INVALID_INPUT;
		}
		catch {
			this.addInvalidError('Input is not valid <code>JSON</code>.');
			return InputFieldValidator.INVALID_INPUT;
		}
	}
}

const typeGuards: Record<string, TypeGuard> = {
	isNullableString(value) {
		return (typeof value === 'string' || value === null);
	},
	isString(value) {
		return (typeof value === 'string');
	},
	isParsableNumber(value) {
		return (typeof value === 'string' && !isNaN(Number(value)));
	},
	isEmojiRequest(value) {
		return (typeof value === 'string' && (<string[]>VALID_EMOJIS).includes(value));
	},
};

export class StringField extends InputFieldValidator {
	public constructor(elementId: string) {
		super(elementId, typeGuards.isNullableString, 'string');
	}
}

export class RequiredStringField extends RequiredField {
	public constructor(elementId: string) {
		super(elementId, typeGuards.isString, 'string');
	}
}

export class RequiredNumberAsStringField extends RequiredField {
	public constructor(elementId: string) {
		super(elementId, typeGuards.isParsableNumber, 'number');
	}
}

export class JSONStringObjectField extends JSONObjectField {
	public constructor(elementId: string) {
		super(elementId, typeGuards.isString, 'string');
	}
}

export class JSONEmojiObjectField extends JSONObjectField {
	public constructor(elementId: string) {
		super(elementId, typeGuards.isEmojiRequest, 'emoji');
	}
}

export class TimeZoneField extends InputFieldValidator {
	public constructor(elementId: string) {
		super(elementId, typeGuards.isNullableString, 'string');
	}

	protected override async validator(inputValue: NullIfEmpty<string>): Promise<NullIfEmpty<string> | typeof InputFieldValidator.INVALID_INPUT> {
		if (!inputValue) return null;

		if (await super.validator(inputValue) === inputValue) {
			try {
				Intl.DateTimeFormat(undefined, { timeZone: inputValue });
				return inputValue;
			}
			catch {
				this.addInvalidError('Invalid time zone.');
			}
		}
		return InputFieldValidator.INVALID_INPUT;
	}
}