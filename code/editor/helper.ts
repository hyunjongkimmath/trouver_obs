import { EditorPosition, EditorRange, LinkCache, Loc, Plugin} from "obsidian";

/**
 * Returns `true` whether `pos` comes before `other`.
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
 * Converts a Loc to an EditorPosition.
 * @param {Loc} loc 
 * @returns {EditorPosition}
 */
export function locToEditorPosition(loc: Loc): EditorPosition {
    // console.log("locToEditorPosition")
    // console.log(loc)
    const line = loc.line
    const ch = loc.col !== undefined ? loc.col : loc.ch 
	const pos: EditorPosition = {
		line: loc.line,
		ch: ch,
	};
    // console.log(pos)
	return pos;
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


 /*
 * The following functions are intended to implement an abstract situation for finding 
 * `things` in files. For example, links could take the role of `things`, see
 * the function `getCurrentLinkIndex`.
 */


/**
 * Returns the index of the `thing` immediately following the specified
 * EditorPosition
 * @param {EditorPosition} pos
 * @param {Array} things 
 * @param {string} by either `start` or `end`; if `start`, then finds the index
 * of the `thing` whose start immediately follows `pos`. Otherwise, finds the index
 * of the `thing` whose end immediately follows `pos`.
 * @param {(thing: Object) => Loc} posFromThing specifies how to get the Loc object ({start: {...}, end: {...}, offset: {...}}) representing the position of a `thing`
 * @param {boolean} reverse
 * @returns {number} An index corresponding to an entry in `things`. -1 is there is no `thing`
 * following `pos`.
 */
export function getNextThingIndex(
        pos: EditorPosition, things: Array, 
        locFromThing: (thing: Object) => Loc,
        reverse: boolean = false): number {
    if (!things) {return -1;}
	let i = 0;
	if (!reverse) {
		// while (i < things.length && !positionComesBeforeLoc(pos, things[i].position[by], false)) {
		while (i < things.length && !positionComesBeforeLoc(pos, locFromThing(things[i]), false)) {
			i++;
		}
	} else {
		i = things.length-1;
		while (-1 < i && positionComesBeforeLoc(pos, locFromThing(things[i]), true)){
			i--;
		}
	}
	if (-1 < i && i < things.length) {
		return i;
	} else {
		return -1;
	}
}


/**
 * Returns the index of the `thing` that the `EditorPosition is at.
 * 
 * 
 * @param {EditorPosition} pos
 * @param {Array} things
 * @param {(thing: Object) => Object} posFromThing gets the {start: {line: ch:}, end: {line: ch:}} object from a `thing`.
 * @returns {number} An index corresponding to an entry in `things`. -1 if the EditorPosition is not
 * at a `thing`
 */
export function getCurrentIndex(
        pos: EditorPosition, things: Array, posFromThing: (thing: Object) => Object,
        ): number{
    // console.log(pos)
    // console.log(things)
    if (!things) {return -1;}
    let i = getNextThingIndex(pos, things, (thing) => posFromThing(thing).start);
    // console.log(i)
    if (i == -1){
        i = things.length - 1;
    } else {
        i--;
    }
    let range = locPairToRange(posFromThing(things[i]).start, posFromThing(things[i]).end);
    // console.log(range)
    // console.log(positionInRange(pos, range))
    if (positionInRange(pos, range)) { return i; }
    i++;
    // console.log(things[1].position) 
    if (i >= things.length){ return -1; }
    range = locPairToRange(posFromThing(things[i]).start, posFromThing(things[i]).end);
    if (positionInRange(pos, range)) { 
        return i; 
    } else {
        return -1;
    }

}
    


//TODO: the following is incomplete; 
/**
 * Move to the next `thing`
 * @param {Plugin} plugin
 * @param {Editor} editor
 * @param {boolean} reverse
 */
export function goToNextThing(
        plugin: Plugin,
        editor: Editor,
        getThings: (plugin: Plugin, editor: Editor) => (Array),
        locFromThing: (thing: Object) => Loc,
        reverse: boolean = false){
    const cursor = editor.getCursor()
	// const currentFile = plugin.app.workspace.getActiveFile()
    const things = getThings(plugin, editor)
    let goTo = getNextThingIndex(cursor, things, locFromThing ,reverse)
	// let goTo = getNextLinkIndex(cursor, fileCache.links, 'end', reverse);
	if (goTo == -1){ return; }
    // console.log(goTo)
	let pos = locToEditorPosition(things[goTo].start);
	editor.setCursor(pos); 
}
