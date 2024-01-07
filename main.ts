import { App, Editor, EditorPosition, KeymapEventHandler, KeymapEventListener, MarkdownView, Modal, Notice, parseLinktext, Plugin, PluginSettingTab, Scope, Setting, stringifyYaml, TFile } from 'obsidian';
import { pathAcceptedString, getAllHeadingTitles } from './helper';
import { ObsidianLink } from './links';
import { getNextLinkIndex, locToEditorPosition, getCurrentLinkIndex} from './navigate';
import { TrouverObsSettingTab } from './settings';
import { updateMetaAliases } from "frontmatter";

interface TrouverObsSetting {
	referenceName: string;
}

const DEFAULT_SETTINGS: Partial<TrouverObsSetting> = {
	referenceName: '',
};

/**
 * This Plugin allows for some quick modifications of links
 */
export default class TrouverObs extends Plugin {

	settings: TrouverObsSetting;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new TrouverObsSettingTab(this.app, this));

		this.addCommand({
			id: 'go-to-next-link',
			name: 'Go to next link',
			hotkeys: [{modifiers: ["Shift", "Alt"], key: 'd'}],
			editorCallback: (editor: Editor) => {
				this.goToNextLink(editor);
			}
		});
		this.addCommand({
			id: 'go-to-previous-link',
			name: 'Go to previous link',
			hotkeys: [{modifiers: ['Shift', "Alt"], key: 'a'}],
			editorCallback: (editor: Editor) => {
				this.goToNextLink(editor, true);
			}
		});
		this.addCommand({
			id: 'remove-link',
			name: "Remove link",
			hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'r'}],
			editorCallback: (editor: Editor) =>{
				this.removeLink(editor);
			}
		});
		
		this.addCommand({
			id: 'make-notation-note',
			name: 'Make notation note',
			hotkeys: [{modifiers: ['Mod', 'Shift', 'Alt'], key: 'n'}],
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view){
					if (!checking) {
						const selection = view.editor.getSelection();
						const currentFile = this.app.workspace.getActiveFile();
						this.createNotationNote(this.settings.referenceName, selection, currentFile);
					}
					return true;
				}
				return false;
			}
		});
		this.addCommand({
			id: 'copy-file-name-of-current-pane',
			name: 'Copy file name of current pane',
			hotkeys: [{modifiers: ['Mod', 'Shift'], key: 'c'}],
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					if (!checking) {
						navigator.clipboard.writeText(file.basename);
						new Notice(`Copied '${file.basename}' to clipboard.`);
					}
					return true;
				}
				return false;
			}
		});
		
		/*this.addCommand({
			id: 'go-to-next-header',
			name: "Go to next header",
			hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'k'}],
			editorCallback: (editor: Editor) =>{
				const file = this.app.workspace.getActiveFile();
				const fileCache = this.app.metadataCache.getFileCache(file);
				console.log(fileCache);
				editor.getCursor();
				fileCache.headings;
			}
		});*/

		this.addCommand({
			id: 'make-alias-from-headers',
			name: "Make alias from headers",
			hotkeys: [{modifiers: ['Shift', 'Mod'], key: 'a'}],
			editorCallback: (editor: Editor) =>{
				const file = this.app.workspace.getActiveFile();
				const fileCache = this.app.metadataCache.getFileCache(file);
				// console.log(fileCache);
				// editor.getCursor();
				// fileCache.headings
				let headings = getAllHeadingTitles(fileCache, true);
				headings = headings.map( (heading) => heading);
				headings = headings.filter(function(heading) { 
					return !( ['Topic', 'See Also', 'Meta', 'References', 'Citations and Footnotes', 'Code'].includes(heading) )});
				let aliases = headings.map( (heading) => `${this.settings.referenceName}_${pathAcceptedString(heading)}`);
				aliases = aliases.filter(function(alias) {  // Filter out aliases if they are already in frontmatter.
					return !( fileCache.frontmatter.aliases.includes(alias)) });
				let all_aliases = fileCache.frontmatter.aliases.concat(aliases);
				updateMetaAliases(this.app, all_aliases);
			}
		});

		this.addCommand({
			id: 'copy-reference-name-to-clipboard',
			name: 'Copy reference name to clipboard',
			hotkeys: [{modifiers: ['Alt', 'Shift'], key: 'c'}],
			callback: () => {
				navigator.clipboard.writeText(`${this.settings.referenceName}_`);
				new Notice(`Copied '${this.settings.referenceName}_' to clipboard.`);
			}
		})

		this.addCommand({
			id: 'add-footnote',
			name: 'Add footnote',
			hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
			editorCallback: (editor: Editor) => {
				// TODO
			}
		});

		/*this.addCommand({
			id: 'navigate-math-mode'
		})*/
		/*this.addCommand({
			id: 'copy-right-file-name',
			name: 'Copy file name in pane to the right of current pane',
			hotkeys: [{modifiers: ['Mod', 'Shift'], key: 'v'}],
			checkCallback: (checking: boolean) => {
				const right_leaf = this.app.workspace.getRightLeaf(false);
				if (right_leaf) {
					if (!checking) {
						console.log(right_leaf);
						//navigator.clipboard.writeText(right_file.basename);
						//new Notice(`Copied '${right_file.basename}' to clipboard.`);
					}
					return true;
				}
				return false;
			}
		});*/
		/*this.addCommand({
			id: 'copy-file-name-in-right-pane',
			name: 'Copy file name in pane to the right of current pane',
			hotkeys: [{modifiers: ['Mod', 'Shift'], key: 'v'}],
			checkCallback: (checking: boolean) => {
				const right_leaf = this.app.workspace.getRightLeaf(false);
				const right_file = right_leaf.view.file;
				if (right_file) {
					if (!checking) {
						navigator.clipboard.writeText(right_file.basename);
						new Notice(`Copied '${right_file.basename}' to clipboard.`);
					}
					return true;
				}
				return false;
			}
		});*/
	}

	async onunload() {
		console.log('test');
		//this.app.workspace.detachLeavesOfType(CURSOR_SHOW_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	goToNextLink(editor: Editor, reverse: boolean = false) {
		const cursor = editor.getCursor()
		const currentFile = this.app.workspace.getActiveFile()
		const fileCache = this.app.metadataCache.getFileCache(currentFile);
		// console.log(fileCache.links);
		let goTo = getNextLinkIndex(cursor, fileCache.links, 'end', reverse);
		if (goTo == -1){ return; }
		let pos = locToEditorPosition(fileCache.links[goTo].position['end']);
		// pos['ch'] -= 2;
		// console.log(pos);
		editor.setCursor(pos);
	}

	removeLink(editor: Editor){
		const cursor = editor.getCursor()
		const currentFile = this.app.workspace.getActiveFile()
		const fileCache = this.app.metadataCache.getFileCache(currentFile);
		let index = getCurrentLinkIndex(cursor, fileCache.links);
		if (index == -1) { return; }
		let sp = locToEditorPosition(fileCache.links[index].position.start);
		let ep = locToEditorPosition(fileCache.links[index].position.end);
		// console.log(parseLinktext(fileCache.links[index].original))
		let ol = ObsidianLink.fromText(fileCache.links[index].original);
		editor.replaceRange(ol.displayText(), sp, ep);
	}

	/*
	leafFunction(n, relative) {
		const leaves = [];
		this.app.workspace.iterateRootLeaves((leaf) => (leaves.push(leaf), false));
		console.log(leaves);
		/* if (relative) {
			n += leaves.indexOf(this.app.workspace.activeLeaf);
			n = (n + leaves.length) % leaves.length;  // wrap around
		}
		const leaf = leaves[n >= leaves.length ? leaves.length-1 : n];
		!leaf || this.app.workspace.setActiveLeaf(leaf, true, true); */
	//}


	/**
	 * Creates a Notation note, add the phrase '<notation> denotes' with the string
	 * 'denotes' linking to the current workspace index note.
	 * 
	 * TODO add a link of the notation note to the main file.
	 * 
	 * @param {string} referenceName e.g. arapura_CAV
	 * @param {string} notation e.g. H_i_et_X_F
	 * @param {TFile} mainFile the information note that the notation comes from.
	 */
	async createNotationNote(
		referenceName: string, notation: string, mainFile: TFile): Promise<void> {
		const notationForPath = pathAcceptedString(notation);
		const path = mainFile.parent.path;
		const fileName = `${path}/${referenceName}_notation_${notationForPath}`
		let filePath;
		if (await this.app.vault.adapter.exists(`${fileName}.md`)) {
			let num = 0;
			while (await this.app.vault.adapter.exists(`${fileName}_${num}.md`)) {
				num++;
			}
			filePath = `${fileName}_${num}.md`;
		} else {
			filePath = `${fileName}.md`;
		}
		const file = await this.app.vault.create(filePath, '');
		const text = `${notation} [[${mainFile.basename}|denotes]] `
		await this.app.vault.modify(file, text);
		const newLeaf = this.app.workspace.splitActiveLeaf();
		await newLeaf.openFile(file);
		this.app.workspace.setActiveLeaf(newLeaf, true, true);
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const pos: EditorPosition = {
			line: 0,
			ch: text.length
		}
		view.editor.setCursor(pos);
		//view.editor.setCursor(0);
		// this.app.workspace.createLeafBySplit()
		// this.app.workspace.activeLeaf.openFile(file);
	}


	
	
}


// import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
// import { Notice, Plugin } from "obsidian";

// // TODO: Get titles from html definitions
// // TODO: Copy from old code
// // TODO: insert html tags onto text selection

// // Remember to rename these classes and interfaces!

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

// export default class HelloWorldPlugin extends Plugin {
// 	settings: MyPluginSettings;

// 	async onload() {
// 		this.addRibbonIcon('dice', 'Greet', () => {
// 			new Notice('Hello, world!');
// 		});

// 		await this.loadSettings();

// 		// This creates an icon in the left ribbon.
// 		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
// 			// Called when the user clicks the icon.
// 			new Notice('This is a notice!');
// 		});
// 		// Perform additional things with the ribbon
// 		ribbonIconEl.addClass('my-plugin-ribbon-class');

// 		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
// 		const statusBarItemEl = this.addStatusBarItem();
// 		statusBarItemEl.setText('Status Bar Text');

// 		// This adds a simple command that can be triggered anywhere
// 		this.addCommand({
// 			id: 'open-sample-modal-simple',
// 			name: 'Open sample modal (simple)',
// 			callback: () => {
// 				new SampleModal(this.app).open();
// 			}
// 		});
// 		// This adds an editor command that can perform some operation on the current editor instance
// 		this.addCommand({
// 			id: 'sample-editor-command',
// 			name: 'Sample editor command',
// 			editorCallback: (editor: Editor, view: MarkdownView) => {
// 				console.log(editor.getSelection());
// 				editor.replaceSelection('Sample Editor Command');
// 			}
// 		});
// 		// This adds a complex command that can check whether the current state of the app allows execution of the command
// 		this.addCommand({
// 			id: 'open-sample-modal-complex',
// 			name: 'Open sample modal (complex)',
// 			checkCallback: (checking: boolean) => {
// 				// Conditions to check
// 				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
// 				if (markdownView) {
// 					// If checking is true, we're simply "checking" if the command can be run.
// 					// If checking is false, then we want to actually perform the operation.
// 					if (!checking) {
// 						new SampleModal(this.app).open();
// 					}

// 					// This command will only show up in Command Palette when the check function returns true
// 					return true;
// 				}
// 			}
// 		});

// 		// This adds a settings tab so the user can configure various aspects of the plugin
// 		this.addSettingTab(new SampleSettingTab(this.app, this));

// 		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
// 		// Using this function will automatically remove the event listener when this plugin is disabled.
// 		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
// 			console.log('click', evt);
// 		});

// 		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
// 		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
// 	}

// 	onunload() {

// 	}

// 	async loadSettings() {
// 		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
// 	}

// 	async saveSettings() {
// 		await this.saveData(this.settings);
// 	}
// }

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const {containerEl} = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
// }
