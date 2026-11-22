import { App, Modal, Setting } from 'obsidian';

export interface PromptOptions {
	title: string;
	placeholder: string;
	initialValue: string;
	submitLabel: string;
	validate: (value: string) => string | null;
	onSubmit: (value: string) => void | Promise<void>;
}

export class PromptModal extends Modal {
	constructor(
		app: App,
		private opts: PromptOptions,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl, opts } = this;
		this.setTitle(opts.title);

		const input = contentEl.createEl('input', {
			type: 'text',
			cls: 'onb-prompt-input',
			attr: { placeholder: opts.placeholder },
		});
		input.value = opts.initialValue;
		const error = contentEl.createDiv({ cls: 'onb-prompt-error' });

		const submit = () => {
			const value = input.value.trim();
			const message = opts.validate(value);
			if (message) {
				error.setText(message);
				return;
			}
			this.close();
			void opts.onSubmit(value);
		};

		input.addEventListener('keydown', (evt) => {
			if (evt.key === 'Enter') {
				evt.preventDefault();
				submit();
			}
		});

		new Setting(contentEl)
			.addButton((btn) => btn.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((btn) =>
				btn.setButtonText(opts.submitLabel).setCta().onClick(submit),
			);

		input.focus();
		input.select();
	}

	onClose() {
		this.contentEl.empty();
	}
}
