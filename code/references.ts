import TrouverObs from "main";
import { Plugin, TFile } from "obsidian";

/**
 * @param plugin
 * @returns {string}
 */
export async function getReferenceName(plugin: TrouverObs): Promise<string> {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) return plugin.settings.referenceName;

    // 1. Look in the current note
    const content = await plugin.app.vault.read(activeFile);
    const match = content.match(/!?\[\[_reference_(.+?)\]\]/);
    if (match) return match[1];

    // 2. Look in linked notes
    const linkedFiles = plugin.app.metadataCache.getFileCache(activeFile)?.links || [];
    for (const link of linkedFiles) {
        const linkedFile = plugin.app.metadataCache.getFirstLinkpathDest(link.link, activeFile.path);
        if (linkedFile instanceof TFile) {
            const linkedContent = await plugin.app.vault.read(linkedFile);
            const linkedMatch = linkedContent.match(/!?\[\[_reference_(.+?)\]\]/);
            if (linkedMatch) return linkedMatch[1];
        }
    }

    // TODO: Look at index note at base

    // 3. Return default from plugin settings
    return plugin.settings.referenceName;
}