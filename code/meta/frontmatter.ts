import { App, CachedMetadata, Editor, Plugin, TFile, Vault } from "obsidian";
import { getAllHeadingTitles } from "code/fast_link_edit/helper";
import { pathAcceptedString } from "code/fast_link_edit/helper";
import { getAllDefinitions } from "code/definition_and_notation/helper";

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
        return -1;
    }
}


/**
 * 
 * Update the current active file with the specified aliases
 * 
 * @param app 
 * @param {Array<string>} aliases 
 * @returns {void}
 */
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

/**
 * Update the active file with aliases via headings and HTML Tags
 * 
 * @param plugin 
 * @param editor 
 */

export async function updateMetaAliasesFromHeadingsAndHTMLTags(
        plugin: Plugin, editor: Editor): void {
    const file = plugin.app.workspace.getActiveFile();
    const fileCache = plugin.app.metadataCache.getFileCache(file);

    const headings = collectHeadings(fileCache);
    const definitions = await getAllDefinitions(plugin.app.vault, file);
    const toBeAliases = [...headings, ...definitions];

    let aliases = toBeAliases.map( (alias) => `${plugin.settings.referenceName}_${pathAcceptedString(alias)}`)
    aliases = aliases.filter(function(alias) {  // Filter out aliases if they are already in frontmatter.
        return !( fileCache.frontmatter.aliases.includes(alias)) });
    var _ = require('lodash');
    aliases = _.uniq(aliases);
    let all_aliases = fileCache.frontmatter.aliases.concat(aliases);

    updateMetaAliases(plugin.app, all_aliases);
}


/**
 * Collect headings from the file, except for the standard headings in
 * standard information notes.
 * @param fileCache 
 */
function collectHeadings(
        fileCache: CachedMetadata): string[] {
    let headings = getAllHeadingTitles(fileCache, true);
    headings = headings.map( (heading) => heading);
    headings = headings.filter(function(heading) { 
        return !( ['Topic', 'See Also', 'Meta', 'References', 'Citations and Footnotes', 'Code'].includes(heading) )});
    return headings
}

// /**
//  * 
//  */
// function collectDefinitions(
//         vault: Vault, file: TFile){
//     let definitions = getAllDefinitions(vault, file);
//     return definitions
// }