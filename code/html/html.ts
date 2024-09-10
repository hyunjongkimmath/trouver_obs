import { locToEditorPosition } from 'code/editor/helper';
import { Editor, EditorPosition, MarkdownEditView, Plugin } from 'obsidian';
import parse from 'node-html-parser';
import HTMLElement2 from 'node-html-parser';
import { getCurrentIndex } from 'code/editor/helper';

// TODO: write tests

/**
 * Insert a specified HTML tag to surround the selection in the editor.
 * The selection is assumed to be within a single line of text, not spanning
 * multiple lines.
 * 
 * 
 * @param {Plugin} plugin 
 * @param {string} html_tag_start The start of the html tag to insert; this string should also explicitly specify attributes.
 * @param {string} html_tag_end The end of the html tag to insert  
 * @returns {void}
 */
export async function insertHTMLTagAroundSelection(
        plugin: Plugin,
        editor: Editor,
        html_tag_start: string,
        html_tag_end: string){
    // const view = plugin.app.workspace.getActiveViewOfType(MarkdownEditView);
    // if (!view){
    //     return
    // }
    const selection = editor.getSelection();
    const cursor = editor.getCursor() // The cursor is at the end of the selection.
    const cursorFirstPosition = selectionFirstPosition(cursor, selection);
    const currentFile = plugin.app.workspace.getActiveFile()
    const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
    const replacement = `${html_tag_start}${selection}${html_tag_end}`
    // const cursorPosition = locToEditorPosition(cursor)
    editor.replaceRange(
        replacement,
        cursorFirstPosition,
        cursor)
    const cursorNewLastPosition = positionFrom(cursorFirstPosition, replacement)
    editor.setCursor(cursorNewLastPosition)
    // view.editor.replaceRange(, )
}


/**
 * Return the position of the character that the selection starts with
 * @param {EditorPosition} cursorPosition The position returned by `editor.getCursor()`; this is the position of the final character of the selection.
 * @param {string} selection 
 * @returns {EditorPosition}
 */
function selectionFirstPosition(
        cursorPosition: EditorPosition, selection: string): EditorPosition{
    const pos: EditorPosition = {
        line: cursorPosition.line,
        ch: cursorPosition.ch - selection.length
    }
    return pos;
}

function positionFrom(
        cursorFirstPosition: EditorPosition, replacement: string): EditorPosition{
    const pos: EditorPosition = {
        line: cursorFirstPosition.line,
        ch: cursorFirstPosition.ch + replacement.length
    }
    return pos;
}

/**
 * Gets a list of HTML tags found in a text
 * 
 */

/**
 * Remove the HTML tag at the cursor's current location (if such a
 * tag exists)
 * @param plugin
 */
export async function removeHTMLTag(
        plugin: Plugin,
        editor: Editor,
        ): void{
    const currentFile = plugin.app.workspace.getActiveFile()
    let text = await plugin.app.vault.read(currentFile);
    const tags = htmlTags(text);
    const index = getCurrentIndex(
        editor.getCursor(), tags, 
        (tag) => ({start: editor.offsetToPos(tag.start), end: editor.offsetToPos(tag.end)}))
    if (index == -1){ return }
    let tag = tags[index]
    let sp = locToEditorPosition(editor.offsetToPos(tag.start))
    let ep = locToEditorPosition(editor.offsetToPos(tag.end))
    editor.replaceRange(tag.node.rawText, sp, ep)
    // Immediately persist the changes
    await plugin.app.vault.modify(currentFile, editor.getValue())
}

/**
 * 
 * @param text 
 * @returns {Object} Has the attributes start, end, node, which 
 */
function htmlTags(text: string){
    // console.log('hi')
    let node = parse(text);
    const tags = [];
    var currentOffset = 0
    node.childNodes.forEach((child, index) => {
        if (child.tagName) {
            tags.push({
                start: currentOffset,
                end: currentOffset + child.toString().length,
                node: child
            }) 
        }
        // console.log(text.substring(currentOffset, currentOffset + child.toString().length))
        currentOffset += child.toString().length
    });
    return tags;
}




export async function addHTMLCommands(plugin: Plugin){
    // console.log('hi')
    plugin.addCommand({
        id: 'insert-b-definition-tag',
        name: 'Insert HTML <b> tag with "definition" attribute',
        hotkeys: [{modifiers: ["Ctrl"], key: 'd'}],
        editorCallback: (editor: Editor) => {
            insertHTMLTagAroundSelection(plugin, editor, "<b style=\"border-width:1px;border-style:solid;padding:3px\" definition=\"\">", "</b>")
        }
    });

    plugin.addCommand({
        id: 'insert-span-tag',
        name: 'Insert HTML <span> tag',
        hotkeys: [{modifiers: ["Ctrl", "Shift", "Alt"], key: 'j'}],
        editorCallback: (editor: Editor) => {
            insertHTMLTagAroundSelection(plugin, editor, "<span>", "</span>")
        }
    });

    plugin.addCommand({
        id: 'insert-notation-tag',
        name: 'Insert HTML <span> tag with "notation" attribute and a box style',
        hotkeys: [{modifiers: ["Ctrl", "Shift"], key: 'd'}],
        editorCallback: (editor: Editor) => {
            insertHTMLTagAroundSelection(plugin, editor, '<span style="border-width:1px;border-style:solid;padding:3px" notation="">', "</span>")
        }
    })

    plugin.addCommand({
        id: 'remove-HTML-tag',
        name: 'remove HTML tag at the cursor location',
        hotkeys: [{modifiers: ["Shift", "Alt"], key: 'n'}],
        editorCallback: (editor: Editor) => {
            removeHTMLTag(this, editor);
        }
    })
}