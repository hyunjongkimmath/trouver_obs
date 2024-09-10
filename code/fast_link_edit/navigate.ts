import { EditorPosition, LinkCache, Plugin} from 'obsidian';
import { getCurrentIndex, getNextThingIndex, goToNextThing, locPairToRange, locToEditorPosition, positionComesBeforeLoc, positionInRange } from 'code/editor/helper';
/**
 * The functions here 
 */



/**
 * Returns the index of the link immediately following the specified
 * EdiorPosition.
 * @param {EditorPosition} pos 
 * @param {LinkCache[]} links 
 * @param {string} by either 'start' or 'end'; if 'start', then finds the index of the link
 * whose start immediately follows `pos`. Otherwise, finds the index of the link whose end
 * immeidately follows `pos`.
 * @param {boolean} reverse
 * @returns {number} An index corresponding to an entry in `links`. -1 if there is no link following
 * `pos`.
 */

 export function getNextLinkIndex(
		pos: EditorPosition, links: Array, by: string = 'start',
		reverse: boolean = false): number {
	return getNextThingIndex(pos, links, (link) => link.position[by], reverse)
}


/**
 * Returns the index of the link that the EditorPosition is at.
 * @param {EditorPosition} pos 
 * @param {LinkCache[]} links 
 * @returns {number} An index corresponding to an entry in `link`. -1 if the EditorPosition is not
 * at a link.
 */
export function getCurrentLinkIndex(
    pos: EditorPosition, links: LinkCache[]): number{
	return getCurrentIndex(pos, links, (link) => link.position);
}

/**
 * 
 * @param editor 
 * @param reverse 
 * @returns 
 */

export function goToNextLink(plugin: Plugin, editor: Editor, reverse: boolean = false) {
	const cursor = editor.getCursor()
	const currentFile = plugin.app.workspace.getActiveFile()
	const fileCache = plugin.app.metadataCache.getFileCache(currentFile);

	// function getLinks(plugin: Plugin, editor: Editor){
	// 	const currentFile = plugin.app.workspace.getActiveFile()
	// 	const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
	// 	return fileCache.links
	// }
	// function locFromLink(link: LinkCache){
	// 	return link.position
	// }
	// goToNextThing(plugin, editor, getLinks, locFromLink, reverse)

	let goTo = getNextLinkIndex(cursor, fileCache.links, 'end', reverse);
	if (goTo == -1){ return; }
	let pos = locToEditorPosition(fileCache.links[goTo].position['end']);
	editor.setCursor(pos);
}