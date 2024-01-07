import TrouverObs from "main";
import { App, PluginSettingTab, Setting } from "obsidian";


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
    }
}