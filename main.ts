import { App, Editor, EditorPosition, KeymapEventHandler, KeymapEventListener, MarkdownView, Modal, Notice, parseLinktext, Plugin, PluginSettingTab, Scope, Setting, stringifyYaml, TFile } from 'obsidian';
import { pathAcceptedString, getAllHeadingTitles } from './code/fast_link_edit/helper';
import { ObsidianLink } from './code/links';
import { getNextLinkIndex, locToEditorPosition, getCurrentLinkIndex, goToNextLink} from './code/fast_link_edit/navigate';
import { TrouverObsSettingTab } from './code/settings';
import { removeLink } from 'code/fast_link_edit/edit_link';
import { updateMetaAliases } from "code/fast_link_edit/frontmatter";
import { createNotationNote } from 'code/notation';
import { addCommands } from 'code/add_commands';

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
		await addCommands(this);	
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

}

