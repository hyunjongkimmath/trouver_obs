import { Plugin } from 'obsidian';
import { TrouverObsSettingTab } from './code/settings';
import { addCommands } from 'code/add_commands';

const yaml = require('js-yaml');

//See https://stackoverflow.com/questions/72396827/how-to-include-python-files-in-node-js-build
//to copy python files

interface TrouverObsSetting {
	referenceName: string;
	venvPath: string;
}

const DEFAULT_SETTINGS: Partial<TrouverObsSetting> = {
	referenceName: '',
	venvPath: String.raw`C:\Users\hyunj\Documents\Development\Python\trouver_py312_venv`,
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

