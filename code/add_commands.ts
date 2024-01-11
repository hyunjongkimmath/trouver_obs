import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { removeLink } from "./fast_link_edit/edit_link";
import { updateMetaAliases } from "./fast_link_edit/frontmatter";
import { getAllHeadingTitles, pathAcceptedString } from "./fast_link_edit/helper";
import { goToNextLink, getCurrentLinkIndex } from "./fast_link_edit/navigate";
import { toggleMetaTag } from "./fast_toggle_tags/meta";
import { createNotationNote } from "./notation";
import { ObsidianLink } from "./links";

// TODO: document the functions here

/**
 * 
 * @param pluHgin 
 * @returns {void}
 */
export async function addCommands(plugin: Plugin) {
    await addFastLinkEditCommands(plugin);
    await addFastToggleTagsCommands(plugin);
    await addIndexViewCommands(plugin);
}

export async function addFastLinkEditCommands(plugin: Plugin) {
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
    
    // TODO: factor out main code from below
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
    // TODO: factor out main code from below
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

    // TODO: factor out main code from below
    plugin.addCommand({
        id: 'make-alias-from-headers',
        name: "Make alias from headers",
        hotkeys: [{modifiers: ['Shift', 'Mod'], key: 'a'}],
        editorCallback: (editor: Editor) =>{
            const file = plugin.app.workspace.getActiveFile();
            const fileCache = plugin.app.metadataCache.getFileCache(file);
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


export async function addFastToggleTagsCommands(plugin: Plugin) {
    const tags = ['_meta/definition', '_meta/notation', '_meta/concept', '_meta/proof',
                    '_meta/narrative', '_meta/exercise', '_meta/remark', '_meta/example',
                    '_meta/context'];
    const TODOTags = ['_meta/TODO/delete', '_meta/TODO/split', '_meta/TODO/merge',
                        '_meta/TODO/change_title'];

    for (let i = 0; i < tags.length; i++) {
        let tag = tags[i];
        plugin.addCommand({
            id: `toggle-${tag}-tag`,
            name: `Toggle ${tag} tag`,
            hotkeys: [{modifiers: ['Shift', 'Alt'], key: `${i+1}`}],
            checkCallback: (checking: boolean) => {
                const currentFile = plugin.app.workspace.getActiveFile();
                if (currentFile) {
                    if (!checking) {
                        toggleMetaTag(plugin.app, tag);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    for (let i = 0; i < TODOTags.length; i++) {
        let tag = TODOTags[i];
        plugin.addCommand({
            id: `toggle-${tag}-tag`,
            name: `Toggle ${tag} tag`,
            hotkeys: [{modifiers: ['Mod', 'Shift', 'Alt'], key: `${i+1}`}],
            checkCallback: (checking: boolean) => {
                const currentFile = plugin.app.workspace.getActiveFile();
                if (currentFile){
                    if (!checking) {
                        toggleMetaTag(plugin.app, tag);
                    }
                    return true;
                }
                return false;
            }
        })    
    }
}

// TODO: factor out the main code in the below

export async function addIndexViewCommands(plugin: Plugin) {
    plugin.addCommand({
        id: 'open-pane-to-navigate-links-in-current-view',
        name: 'Open pane to navigate links in current view',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'Enter'}],
        editorCallback: async (editor: Editor) => {
            console.log('hello')
            const currentFile = plugin.app.workspace.getActiveFile();
            const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
            const index = getCurrentLinkIndex(editor.getCursor() , fileCache.links);
            const file_name = ObsidianLink.fromText(fileCache.links[index].original).file_name;
            //const file_name = plugin.app.metadataCache.getFirstLinkpathDest(fileCache.links[index].original, '')
            const file = plugin.app.metadataCache.getFirstLinkpathDest(file_name, '');
            await plugin.app.workspace.openLinkText('', file.path, true);
            const leaf = plugin.app.workspace.getLeaf(false);
            leaf.navigateLinkIndex = index;
            leaf.navigateLinks = fileCache.links;
            new Notice('New link-navigation pane opened');
        }
    });

    plugin.addCommand({
        id: 'navigate-pane-to-next-link',
        name: 'Navigate pane to next link',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'j'}],
        checkCallback: (checking: boolean) => {
            const leaf = plugin.app.workspace.getLeaf(false);
            if (leaf.hasOwnProperty('navigateLinkIndex')) {
                if (!checking) {
                    if (leaf.navigateLinkIndex < leaf.navigateLinks.length - 1) {
                        leaf.navigateLinkIndex = leaf.navigateLinkIndex + 1;
                        const file_name = ObsidianLink.fromText(leaf.navigateLinks[leaf.navigateLinkIndex].original).file_name;
                        const file = plugin.app.metadataCache.getFirstLinkpathDest(file_name, '');
                        if (file) { // if the link points to an existing file
                            plugin.app.workspace.openLinkText('', file.path, false);
                        } else {
                            new Notice(`${file_name} does not exist.`)
                        }
                    }
                }
                return true;
            }
            return false;
        }
    });
    plugin.addCommand({
        id: 'navigate-pane-to-previous-link',
        name: 'Navigate pane to previous link',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'k'}],
        checkCallback: (checking: boolean) => {
            const leaf = plugin.app.workspace.getLeaf(false);
            if (leaf.hasOwnProperty('navigateLinkIndex')) {
                if (!checking) {
                    if (leaf.navigateLinkIndex > 0) {
                        leaf.navigateLinkIndex = leaf.navigateLinkIndex - 1;
                        const file_name = ObsidianLink.fromText(leaf.navigateLinks[leaf.navigateLinkIndex].original).file_name;
                        const file = plugin.app.metadataCache.getFirstLinkpathDest(file_name, '');
                        if (file) { // if the link points to an existing file
                            plugin.app.workspace.openLinkText('', file.path, false);
                        } else {
                            new Notice(`${file_name} does not exist.`)
                        }
                    }
                }
                return true;
            }
            return false;
        }
    });
}
