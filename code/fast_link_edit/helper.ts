import { CachedMetadata } from 'obsidian';

/**
 * Converts a LaTeX math mode string to a string
 * that can be used as part of a path.
 * cf. convert_title_to_folder_name in trove.markdown.obsidian.personal.index_notes
 * @param {string} latex
 */
// TODO: This is implemented in trouver; use that implementation.
export function pathAcceptedString(latex: string): string{
    let toRemove = [
        '.', '\'', '$', ')', '{', '}', ':', '?', '!', '#', '%', '&',
        '\\', '<', '>', '*', '?', '/', '"', '@', '+', '`', '|', '=', '[', ']',
        'mathscr', 'mathbf', 'mathrm', 'mathfrak', 'mathcal', 'mathbb', 'operatorname'];
    let turnToUnderscore = [' ', '-', '^', '(', ','];
    latex = latex.trim();
    for (const char of toRemove) {
        latex = latex.split(char).join('');  //Replace All
    }
    for (const char of turnToUnderscore){
        latex = latex.split(char).join('_');
    }
    return latex;
}



/**
 * Returns the headings for a file from a file cache.
 * @param {CachedMetadata} fileCache
 * @param {boolean} remove_footnote_markers If true, removes the footnote markers
 * @returns {Array<string>}
 */
export function getAllHeadingTitles(fileCache: CachedMetadata, remove_footnote_markers: boolean = true): Array<string>{
    let headings = fileCache.headings.map( (entry) => entry.heading );
    if (remove_footnote_markers) {
        headings = headings.map( (heading) => textWithoutFootnoteMarket(heading));
    }
    return headings;
}

/**
 * Returns the string without a footnote marker.
 * @param {string} addText
 * @returns {string}
 */
export function textWithoutFootnoteMarket(text: string): string{
    const regex = /(.+)\[\^([^\]]+)\]/g;
    if (text.match(regex)) {
        return text.replace(regex, '$1');
    } else {
        return text;
    }
}