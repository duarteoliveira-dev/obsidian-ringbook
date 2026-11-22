import { App, Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private title: string,
		private message: string,
		private confirmLabel: string,
		private onConfirm: () => void | Promise<void>,
	) {
		super(app);
	}

	onOpen() {
		this.setTitle(this.title);
		this.contentEl.createEl('p', { text: this.message });
		new Setting(this.contentEl)
			.addButton((btn) => btn.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((btn) =>
				btn
					.setButtonText(this.confirmLabel)
					.setDestructive()
					.setCta()
					.onClick(() => {
						this.close();
						void this.onConfirm();
					}),
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}
