import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { goToNextLink } from "./fast_link_edit/navigate";
import { removeLink } from "./fast_link_edit/edit_link";
import { createNotationNote } from "./notation";
import { getAllHeadingTitles } from "./fast_link_edit/helper";
import { updateMetaAliases } from "./fast_link_edit/frontmatter";
import { pathAcceptedString } from "./fast_link_edit/helper";

/**
 * 
 * @param pluHgin 
 * @returns {void}
 */
export async function addCommands(plugin: Plugin) {

    plugin.addCommand({
        id: 'go-to-next-link',
        name: 'Go to next link',
        hotkeys: [{modifiers: ["Shift", "Alt"], key: 'd'}],
        editorCallback: (editor: Editor) => {
            // plugin.goToNextLink(editor);
            goToNextLink(plugin, editor);
        }
    });
    plugin.addCommand({
        id: 'go-to-previous-link',
        name: 'Go to previous link',
        hotkeys: [{modifiers: ['Shift', "Alt"], key: 'a'}],
        editorCallback: (editor: Editor) => {
            // plugin.goToNextLink(editor, true);
            goToNextLink(plugin, editor, true);
        }
    });
    plugin.addCommand({
        id: 'remove-link',
        name: "Remove link",
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'r'}],
        editorCallback: (editor: Editor) =>{
            removeLink(plugin, editor);
        }
    });
    
    plugin.addCommand({
        id: 'make-notation-note',
        name: 'Make notation note',
        hotkeys: [{modifiers: ['Mod', 'Shift', 'Alt'], key: 'n'}],
        checkCallback: (checking: boolean) => {
            const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (view){
                if (!checking) {
                    const selection = view.editor.getSelection();
                    const currentFile = plugin.app.workspace.getActiveFile();
                    createNotationNote(plugin, plugin.settings.referenceName, selection, currentFile);
                }
                return true;
            }
            return false;
        }
    });
    plugin.addCommand({
        id: 'copy-file-name-of-current-pane',
        name: 'Copy file name of current pane',
        hotkeys: [{modifiers: ['Mod', 'Shift'], key: 'c'}],
        checkCallback: (checking: boolean) => {
            const file = plugin.app.workspace.getActiveFile();
            if (file) {
                if (!checking) {
                    navigator.clipboard.writeText(file.basename);
                    new Notice(`Copied '${file.basename}' to clipboard.`);
                }
                return true;
            }
            return false;
        }
    });

    plugin.addCommand({
        id: 'make-alias-from-headers',
        name: "Make alias from headers",
        hotkeys: [{modifiers: ['Shift', 'Mod'], key: 'a'}],
        editorCallback: (editor: Editor) =>{
            const file = plugin.app.workspace.getActiveFile();
            const fileCache = plugin.app.metadataCache.getFileCache(file);
            // console.log(fileCache);
            // editor.getCursor();
            // fileCache.headings
            let headings = getAllHeadingTitles(fileCache, true);
            headings = headings.map( (heading) => heading);
            headings = headings.filter(function(heading) { 
                return !( ['Topic', 'See Also', 'Meta', 'References', 'Citations and Footnotes', 'Code'].includes(heading) )});
            let aliases = headings.map( (heading) => `${plugin.settings.referenceName}_${pathAcceptedString(heading)}`);
            aliases = aliases.filter(function(alias) {  // Filter out aliases if they are already in frontmatter.
                return !( fileCache.frontmatter.aliases.includes(alias)) });
            let all_aliases = fileCache.frontmatter.aliases.concat(aliases);
            updateMetaAliases(plugin.app, all_aliases);
        }
    });

    plugin.addCommand({
        id: 'copy-reference-name-to-clipboard',
        name: 'Copy reference name to clipboard',
        hotkeys: [{modifiers: ['Alt', 'Shift'], key: 'c'}],
        callback: () => {
            navigator.clipboard.writeText(`${plugin.settings.referenceName}_`);
            new Notice(`Copied '${plugin.settings.referenceName}_' to clipboard.`);
        }
    })

    plugin.addCommand({
        id: 'add-footnote',
        name: 'Add footnote',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
        editorCallback: (editor: Editor) => {
            // TODO
        }
    });

}