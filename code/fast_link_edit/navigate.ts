import { EditorPosition, EditorRange, LinkCache, Loc } from 'obsidian';
/**
 * The functions here 
 */

/**
 * Returns `true` if the specified EditorPosition is within the EdtorRange.
 * @param {EditorPosition} pos
 * @param {EditorPosition} range 
 * @param {boolean} include_from 
 * @param {boolean} include_to 
 * @returns {boolean}
 */
export function positionInRange(
    pos: EditorPosition, range: EditorRange, include_from: boolean = true,
    include_to: boolean = true): boolean {	
	return positionComesBefore(range.from, pos, include_from) && positionComesBefore(pos, range.to, include_to);
}

export function positionPairToRange(from: EditorPosition, to: EditorPosition): EditorRange {
    const range: EditorRange = {
        from: from,
        to: to
    };
    return range;
}

export function locPairToRange(from: Loc, to: Loc): EditorRange {
    let f = locToEditorPosition(from);
    let t = locToEditorPosition(to);
    return positionPairToRange(f, t);
}

/**
 * Returns `true` if 
 * @param {EditorPosition} pos
 * @param {EditorPosition} other The EditorPosition that `pos` is compared against
 * @param {boolean} allowEqual	If `true`, then returns `true` even if `pos` and `other` are the same position/location
 * @returns {boolean}	`true` if `pos` comes before `other`. `false` otherwise.
*/
export function positionComesBefore(
	pos: EditorPosition, other: EditorPosition, allowEqual: boolean = false): boolean {
	if (allowEqual) {
		return pos.line < other.line || (pos.line == other.line && pos.ch <= other.ch);
	} else {
		return pos.line < other.line || (pos.line == other.line && pos.ch < other.ch);
	}
}

/**
 * Returns `true` if 
 * @param {EditorPosition} pos
 * @param {Loc} loc The Loc that `pos` is compared against
 * @param {boolean} allowEqual	If `true`, then returns `true` even if `pos` and `loc` are the same position/location
 * @returns {boolean}	`true` if `pos` comes before `loc`. `false` otherwise.
*/
export function positionComesBeforeLoc(
	pos: EditorPosition, loc: Loc, allowEqual: boolean = false): boolean {
	return positionComesBefore(pos, locToEditorPosition(loc), allowEqual);
}

/**
 * Converts a Loc to an EditorPosition.
 * @param {Loc} loc 
 * @returns {EditorPosition}
 */
export function locToEditorPosition(loc: Loc): EditorPosition {
	const pos: EditorPosition = {
		line: loc.line,
		ch: loc.col,
	};
	return pos;
}


/**
 * Returns the index of the link immediately following the specified
 * EditorPosition.
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
    if (!links) {return -1;}
	let i = 0;
	if (!reverse) {
		while (i < links.length && !positionComesBeforeLoc(pos, links[i].position[by], false)) {
			i++;
		}
	} else {
		i = links.length-1;
		while (-1 < i && positionComesBeforeLoc(pos, links[i].position[by], true)){
			//console.log(`looking at index ${i}`);
			//console.log(links[i].position[by]);
			i--;
		}
	}
	if (-1 < i && i < links.length) {
		return i;
	} else {
		return -1;
	}
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
    if (!links) {return -1;}
    let i = getNextLinkIndex(pos, links);
    if (i == -1){
        i = links.length - 1;
    } else {
        i--;
    }
    let range = locPairToRange(links[i].position.start, links[i].position.end);
    if (positionInRange(pos, range)) { return i; }
    i++;
    if (i >= links.length){ return -1; }
    range = locPairToRange(links[i].position.start, links[i].position.end);
    if (positionInRange(pos, range)) { 
        return i; 
    } else {
        return -1;
    }

}

/**
 * 
 * @param editor 
 * @param reverse 
 * @returns 
 */

export function goToNextLink(plugin: Plugin, editor: Editor, reverse: boolean = false) {
	const cursor = editor.getCursor()
	const currentFile = this.app.workspace.getActiveFile()
	const fileCache = this.app.metadataCache.getFileCache(currentFile);
	// console.log(fileCache.links);
	let goTo = getNextLinkIndex(cursor, fileCache.links, 'end', reverse);
	if (goTo == -1){ return; }
	let pos = locToEditorPosition(fileCache.links[goTo].position['end']);
	// pos['ch'] -= 2;
	// console.log(pos);
	editor.setCursor(pos);
}