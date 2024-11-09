import { Editor, MarkdownView, Notice, Plugin, htmlToMarkdown, TFile} from "obsidian";
import { removeLink } from "./fast_link_edit/edit_link";
import { updateMetaAliases, updateMetaAliasesFromHeadingsAndHTMLTags } from "./meta/frontmatter";
import { getAllHeadingTitles, pathAcceptedString } from "./fast_link_edit/helper";
import { goToNextLink, getCurrentLinkIndex } from "./fast_link_edit/navigate";
import { toggleMetaTag } from "./fast_toggle_tags/meta";
import { createNotationNote } from "./notation";
import { ObsidianLink } from "./links";
import { ManageLinksModal } from "./manage_links/ManageLinksModal";
import { addHTMLCommands } from "./html/html";
import { sanitizeFilename } from "./files";
import { navigateToIndex } from "./navigate_index/navigate_index";
import * as path from 'path';
import * as fs from 'fs';
import { createFootnote } from "./footnotes";

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
    await addManageLinksCommands(plugin);
    await addHTMLCommands(plugin);
    await addRenameFileToSelectionCommand(plugin);
    await addNavigateToIndexCommand(plugin);
    // await addOpenParentVaultCommand(plugin);
    await addCreateFootnoteCommand(plugin);
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
            updateMetaAliasesFromHeadingsAndHTMLTags(plugin, editor);
            // console.log(htmlToMarkdown("<div>hi</div>"))
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

    // plugin.addCommand({
    //     id: 'add-footnote',
    //     name: 'Add footnote',
    //     hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
    //     editorCallback: (editor: Editor) => {
    //         // TODO
    //     }
    // });
}


export async function addFastToggleTagsCommands(plugin: Plugin) {

    const tags = ['_meta/definition', '_meta/notation', '_meta/concept', '_meta/proof',
                    '_meta/narrative', '_meta/exercise', '_meta/remark', '_meta/example',
                    '_meta/context', 'def_and_notat_identified', 'def_and_notat_names_added', 'notation_summary', '_meta/notation_note_named'];
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', ']']
    const TODOTags = ['_meta/TODO/delete', '_meta/TODO/split', '_meta/TODO/merge',
                        '_meta/TODO/change_title', ];

    for (let i = 0; i < tags.length; i++) {
        let tag = tags[i];
        let key = keys[i];
        plugin.addCommand({
            id: `toggle-${tag}-tag`,
            name: `Toggle ${tag} tag`,
            hotkeys: [{modifiers: ['Shift', 'Alt'], key: key}],
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
            // console.log('hello')
            const currentFile = plugin.app.workspace.getActiveFile();
            const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
            const index = getCurrentLinkIndex(editor.getCursor() , fileCache.links);
            // console.log(index)
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

export async function addManageLinksCommands(plugin: Plugin) {
    plugin.addCommand({
        id: 'manage-file-backlinks',
        name: 'Manage file backlinks',
        checkCallback: (checking: boolean) => {
            const file = plugin.app.workspace.getActiveFile();
            if (file) {
                if (!checking) {
                    new ManageLinksModal(plugin.app).open();
                }
                return true;
            }
            return false;
        }
    })
}

export async function addRenameFileToSelectionCommand(plugin: Plugin) {
    plugin.addCommand({
      id: 'rename-and-delete',
      name: 'Rename note to selection and delete line',
      hotkeys: [{modifiers: ["Shift", "Alt"], key: 'e'}],
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection().trim();
        if (!selection) {
          // No text selected or only whitespace
          return;
        }

        const file = view.file;
        if (!file) {
          // No file open
          return;
        }

        // Get the current line number
        const cursor = editor.getCursor();
        const lineNumber = cursor.line;

        try {
          // Sanitize the filename
          const sanitizedName = sanitizeFilename(selection, false);
          if (!sanitizedName) {
            // Invalid filename after sanitization
            new Notice("Invalid filename. Please select a valid name.");
            return;
          }

          // Check if file.parent exists
          if (!file.parent) {
            new Notice("Cannot rename file: Unable to determine parent folder.");
            return;
          }

          // Check if a file with the new name already exists
          const newPath = `${file.parent.path}/${sanitizedName}.md`;
          const existingFile = this.app.vault.getAbstractFileByPath(newPath);
          if (existingFile instanceof TFile) {
            new Notice("A file with this name already exists.");
            return;
          }

          // Rename the file
          await this.app.fileManager.renameFile(file, newPath);

          // Delete the line containing the selection
          editor.replaceRange('', 
            { line: lineNumber, ch: 0 }, 
            { line: lineNumber + 1, ch: 0 }
          );

          // Save the file after deletion
          await this.app.vault.modify(file, editor.getValue());

          new Notice(`File renamed to "${sanitizedName}.md" and line deleted.`);
        } catch (error) {
          console.error('Error renaming file or deleting line:', error);
          new Notice("An error occurred while renaming the file or deleting the line.");
        }
      }
    });
  }

export async function addNavigateToIndexCommand(plugin: Plugin) {
    plugin.addCommand({
      id: 'navigate-to-index',
      name: 'Navigate to Index',
      callback: () => navigateToIndex(this)
    });
}



// export function addOpenParentVaultCommand(plugin: Plugin) {
//   plugin.addCommand({
//     id: 'open-parent-vault',
//     name: 'Open Parent Vault',
//     callback: async () => {
//       const currentFile = plugin.app.workspace.getActiveFile();
//       if (!currentFile) {
//         new Notice('No active file');
//         return;
//       }

//       const vaultPath = findParentVaultPath(currentFile.path);
//       if (!vaultPath) {
//         new Notice('No parent vault found');
//         return;
//       }

//       if (vaultPath === plugin.app.vault.adapter.basePath) {
//         new Notice('Already in the current vault');
//         return;
//       }

//       try {
//         await plugin.app.vault.adapter.exists(vaultPath);
//         await plugin.app.openVault(vaultPath);
//         new Notice(`Opened vault at ${vaultPath}`);
//       } catch (error) {
//         console.error('Error opening vault:', error);
//         new Notice('Failed to open vault');
//       }
//     }
//   });
// }

// function findParentVaultPath(filePath: string): string | null {
//   let currentDir = path.dirname(filePath);
  
//   while (currentDir !== path.parse(currentDir).root) {
//     const obsidianPath = path.join(currentDir, '.obsidian');
//     if (fs.existsSync(obsidianPath)) {
//       return currentDir;
//     }
//     currentDir = path.dirname(currentDir);
//   }
  
//   return null;
// }


export async function addCreateFootnoteCommand(plugin: Plugin) {
    plugin.addCommand({
        id: 'create-footnote',
        name: 'Create Footnote',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
        editorCallback: (editor: Editor) => createFootnote(editor)
    });

}