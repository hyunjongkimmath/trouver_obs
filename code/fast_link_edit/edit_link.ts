import { Editor, Plugin } from 'obsidian';
import { ObsidianLink } from 'code/links';
import { locToEditorPosition, getCurrentLinkIndex} from './navigate';

/**
 * Remove the link at the current cursor location in `editor`,
 * if the cursor is currently at a link.
 * @param {Plugin} plugin 
 * @param {Editor} editor 
 * @returns {void} 
 */
export function removeLink(plugin: Plugin, editor: Editor){
    const cursor = editor.getCursor()
    const currentFile = plugin.app.workspace.getActiveFile()
    const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
    let index = getCurrentLinkIndex(cursor, fileCache.links);
    if (index == -1) { return; }
    let sp = locToEditorPosition(fileCache.links[index].position.start);
    let ep = locToEditorPosition(fileCache.links[index].position.end);
    // console.log(parseLinktext(fileCache.links[index].original))
    let ol = ObsidianLink.fromText(fileCache.links[index].original);
    editor.replaceRange(ol.displayText(), sp, ep);
}