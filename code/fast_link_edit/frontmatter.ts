import { App } from "obsidian";

/**
 * See fast-toggle-tags main.ts
 * @param {string} text 
 * @returns {boolean} True if `text` has a meta frontmatter. 
 */
 function textHasMeta(text: string): boolean {
    text = text.trim();
    if (!text.startsWith('---')) {
        // console.log('a');
        return false;
    }
    return text.slice(4).indexOf('---') != -1
}


/**
 * 
 * @param {string} text 
 * @returns {Object|number} an object with keys "start" and "end" which
 * are the indices in text where the frontmatter tag starts/ends. The
 * end index points to a '\n' character. Returns -1 if
 * there is no frontmatter tag section.
 */
 function findAliasesMetaInText(text: string): Object|number {
    if (!textHasMeta(text)) {
        // console.log('b');
        return -1;
    }
    const metaStart = text.indexOf('---');
    const textWithoutStartMeta = text.slice(metaStart+3);
    const metaEnd = 3 + textWithoutStartMeta.indexOf('---');
    const tag = 3 + textWithoutStartMeta.indexOf('aliases: [');
    if (metaStart < tag && tag < metaEnd) {
        const end = tag + text.slice(tag).indexOf('\n')
        return {'start': tag, 'end': end};
    } else {
        // console.log('c');
        // console.log(metaStart, tag, metaEnd);
        return -1;
    }
}


export async function updateMetaAliases(
        app: App, aliases: Array<string>): void {
    const currentFile = app.workspace.getActiveFile();
    const fileCache = app.metadataCache.getFileCache(currentFile);
    let text = await app.vault.read(currentFile);
    const aliasesIndices = findAliasesMetaInText(text);
    if (aliasesIndices == -1){
        return;
    }
    const aliasesString = `aliases: [${aliases.join(", ")}]`;
    text = text.slice(0, aliasesIndices['start']) + aliasesString + text.slice(aliasesIndices['end']);
    await this.app.vault.modify(currentFile, text);
}