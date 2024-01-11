import { App } from "obsidian";

// TODO: document and test the functions here


/**
 * 
 * @param {string} text 
 * @returns {boolean} True if `text` has a meta frontmatter. 
 */
export function textHasMeta(text: string): boolean {
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
export function findTagsMetaInText(text: string): Object|number {
    if (!textHasMeta(text)) {
        // console.log('b');
        return -1;
    }
    const metaStart = text.indexOf('---');
    const textWithoutStartMeta = text.slice(metaStart+3);
    const metaEnd = 3 + textWithoutStartMeta.indexOf('---');
    const tag = 3 + textWithoutStartMeta.indexOf('tags: [');
    if (metaStart < tag && tag < metaEnd) {
        const end = tag + text.slice(tag).indexOf('\n')
        return {'start': tag, 'end': end};
    } else {
        // console.log('c');
        // console.log(metaStart, tag, metaEnd);
        return -1;
    }
}

/**
 * 
 * @param {App} app 
 * @param {string} tag The tag to toggle.
 * @param {boolean} toggle_auto_tag If `true`, then toggles tag `_auto/${tag}`
 * @returns {void}
 */
export async function toggleMetaTag(
        app: App, tag: string, toggle_auto_tag: boolean = true): void {
    const currentFile = app.workspace.getActiveFile();
    const fileCache = app.metadataCache.getFileCache(currentFile);
    let text = await app.vault.read(currentFile);
    const tagIndices = findTagsMetaInText(text);
    // console.log(tagIndices);
    if (tagIndices == -1){
        return;
    }
    let tagArray = fileCache.frontmatter['tags'].map((x) => x);
    if (tagArray.includes(tag) || tagArray.includes(`_auto/${tag}`)) {
        tagArray = tagArray.filter(e => e !== tag);
        if (toggle_auto_tag){
            tagArray = tagArray.filter(e => e !== `_auto/${tag}`);
        }
    } else {
        tagArray.push(tag);
    }
    const tagString = `tags: [${tagArray.join(', ')}]`
    text = text.slice(0, tagIndices['start']) + tagString + text.slice(tagIndices['end']);
    await this.app.vault.modify(currentFile, text);
}
