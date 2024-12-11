import TrouverObs from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

/**
 * The settings tab for the plugin.
 */


export class TrouverObsSettingTab extends PluginSettingTab {
    plugin: TrouverObs;

    constructor(app: App, plugin: TrouverObs) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Reference name")
            .setDesc("Name of reference; should have underscores instead of spaces.")
            .addText((text) => 
                text
                    .setPlaceholder("")
                    .setValue(this.plugin.settings.referenceName)
                    .onChange(async (value) => {
                        this.plugin.settings.referenceName = value;
                        await this.plugin.saveSettings();
                    })
                );


        // New setting for venvPath
        new Setting(containerEl)
            .setName('Python venv path')
            .setDesc('Path to your Python virtual environment with an installation of `trouver`.')
            .addText(text => text
                .setPlaceholder('/path/to/your/venv')
                .setValue(this.plugin.settings.venvPath)
                .onChange(async (value) => {
                    this.plugin.settings.venvPath = value;
                    await this.plugin.saveSettings();
                }));

    }
}