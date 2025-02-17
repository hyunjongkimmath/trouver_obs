import { EditorPosition, LinkCache, MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf} from 'obsidian';
import { getCurrentIndex, getNextThingIndex, goToNextThing, locPairToRange, locToEditorPosition, positionComesBeforeLoc, positionInRange } from 'code/editor/helper';

import { ObsidianLink } from "../links";
/**
 * The functions here 
 */



// Some functions for navigating links in and Obsidian.md note.

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

	let goTo = getNextLinkIndex(cursor, fileCache.links, 'end', reverse);
	if (goTo == -1){ return; }
	let pos = locToEditorPosition(fileCache.links[goTo].position['end']);
	editor.setCursor(pos);
}

// Some functions for browsing the links in a file into a next pane.

/**
 * 
 * `leaf` is given a `navigateLinkIndex`, `navigateLinks`, and `basefile` attributes.
 * 
 * @param plugin 
 * @param editor 
 */
export async function openNavigationPane(plugin: Plugin, editor: Editor) {
    const currentFile = plugin.app.workspace.getActiveFile();
    const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
    const index = getCurrentLinkIndex(editor.getCursor(), fileCache.links);
    const file_name = ObsidianLink.fromText(fileCache.links[index].original).file_name;
    const file = plugin.app.metadataCache.getFirstLinkpathDest(file_name, '');
    await plugin.app.workspace.openLinkText('', file.path, true);
    const leaf = plugin.app.workspace.getLeaf(false);
    leaf.navigateLinkIndex = index;
	leaf.baseFile = currentFile;
	updateLeafNavigateLinks(plugin, leaf);
	// Focus on the newly opened pane
    plugin.app.workspace.setActiveLeaf(leaf);
    
    // Set focus on the editor
    if (leaf.view instanceof MarkdownView) {
        leaf.view.editor.focus();
    }
    new Notice('New link-navigation pane opened');
}

/**
 * 
 * @param plugin 
 * @param leaf Assumes to have `navigateLinkIndex` and `baseFile` parameters
 */

export async function updateLeafNavigateLinks(
		plugin: Plugin,
		leaf: WorkspaceLeaf) {

    // Wait for the metadata cache to be resolved
	console.log('leaf updating')
	const baseFile = leaf.baseFile;
    await new Promise<void>((resolve) => {
        const handler = (file: TFile) => {
            if (file === baseFile) {
                plugin.app.metadataCache.off('resolved', handler);
                const updatedFileCache = plugin.app.metadataCache.getFileCache(baseFile);
                leaf.navigateLinks = updatedFileCache.links;
                resolve();
            }
        };
        plugin.app.metadataCache.on('resolved', handler);
        
        // Fallback: resolve after a timeout in case the event doesn't fire
        setTimeout(() => {
            plugin.app.metadataCache.off('resolved', handler);
            const updatedFileCache = plugin.app.metadataCache.getFileCache(baseFile);
            leaf.navigateLinks = updatedFileCache.links;
            resolve();
        }, 100); // 0.1 second timeout
    });

	if (leaf.navigateLinkIndex > leaf.navigateLinks.length) {
		leaf.navigateLinksIndex = leaf.navigateLinks.length - 1;
	}
}




/**
 * 
 * @param plugin 
 * @param leaf  // Assumed to have the `.navigateLinkIndex` and `.navigateLinks` attributes.
 * @param nevigateLinkIndex 
 */
export async function openNavigationLink(
		plugin: Plugin,
		leaf: WorkspaceLeaf,
		navigateLinkIndex: number) {
	const file_name = ObsidianLink.fromText(leaf.navigateLinks[navigateLinkIndex].original).file_name;
	const file = plugin.app.metadataCache.getFirstLinkpathDest(file_name, '');
	if (file) {
		plugin.app.workspace.openLinkText('', file.path, false);
		return true;
	}
	return false;
}

export async function navigatePaneToNextLink(plugin: Plugin, checking: boolean): boolean {
	const leaf = plugin.app.workspace.getLeaf(false);
	if (leaf.hasOwnProperty('navigateLinkIndex')) {
		if (!checking) {
			if (leaf.navigateLinkIndex < leaf.navigateLinks.length - 1) {
				leaf.navigateLinkIndex = leaf.navigateLinkIndex + 1;
				const openedFirstTime = await openNavigationLink(plugin, leaf, leaf.navigateLinkIndex);
				if (!openedFirstTime) {
					updateLeafNavigateLinks(plugin, leaf);
					const openedSecondTime = openNavigationLink(plugin, leaf, leaf.navigateLinkIndex);
					if (!openedSecondTime) {
						new Notice(`${file_name} does not exist.`)
					}
				}
				// const file_name = ObsidianLink.fromText(leaf.navigateLinks[leaf.navigateLinkIndex].original).file_name;
				// const file = plugin.app.metadataCache.getFirstLinkpathDest(file_name, '');
				// if (file) { // if the link points to an existing file
				// 	plugin.app.workspace.openLinkText('', file.path, false);
				// } else {
				// 	new Notice(`${file_name} does not exist.`)
				// }
			}
		}
		return true;
	}
	return false;	
}

export async function navigatePaneToPreviousLink(plugin: Plugin, checking: boolean): boolean {
	const leaf = plugin.app.workspace.getLeaf(false);
	if (leaf.hasOwnProperty('navigateLinkIndex')) {
		if (!checking) {
			if (leaf.navigateLinkIndex > 0) {
				leaf.navigateLinkIndex = leaf.navigateLinkIndex - 1;
				const openedFirstTime = await openNavigationLink(plugin, leaf, leaf.navigateLinkIndex);
				if (!openedFirstTime) {
					updateLeafNavigateLinks(plugin, leaf);
					const openedSecondTime = openNavigationLink(plugin, leaf, leaf.navigateLinkIndex);
					if (!openedSecondTime) {
						new Notice(`${file_name} does not exist.`)
					}
				}
			}
		}
		return true;
	}
	return false;

}



