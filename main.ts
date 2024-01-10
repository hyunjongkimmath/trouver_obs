import { App, Editor, EditorPosition, KeymapEventHandler, KeymapEventListener, MarkdownView, Modal, Notice, parseLinktext, Plugin, PluginSettingTab, Scope, Setting, stringifyYaml, TFile } from 'obsidian';
import { pathAcceptedString, getAllHeadingTitles } from './code/fast_link_edit/helper';
import { ObsidianLink } from './code/links';
import { getNextLinkIndex, locToEditorPosition, getCurrentLinkIndex, goToNextLink} from './code/fast_link_edit/navigate';
import { TrouverObsSettingTab } from './code/settings';
import { removeLink } from 'code/fast_link_edit/edit_link';
import { updateMetaAliases } from "code/fast_link_edit/frontmatter";

//See https://stackoverflow.com/questions/72396827/how-to-include-python-files-in-node-js-build
//to copy python files

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
				// this.goToNextLink(editor);
				goToNextLink(this, editor);
			}
		});
		this.addCommand({
			id: 'go-to-previous-link',
			name: 'Go to previous link',
			hotkeys: [{modifiers: ['Shift', "Alt"], key: 'a'}],
			editorCallback: (editor: Editor) => {
				// this.goToNextLink(editor, true);
				goToNextLink(this, editor, true);
			}
		});
		this.addCommand({
			id: 'remove-link',
			name: "Remove link",
			hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'r'}],
			editorCallback: (editor: Editor) =>{
				removeLink(this, editor);
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

	}

	async onunload() {
		// console.log('test');
		//this.app.workspace.detachLeavesOfType(CURSOR_SHOW_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

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
	}
}

