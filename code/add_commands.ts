import { Editor, MarkdownView, Notice, Plugin, htmlToMarkdown, TFile} from "obsidian";
import { removeLink } from "./fast_link_edit/edit_link";
import { updateMetaAliases, updateMetaAliasesFromHeadingsAndHTMLTags } from "./meta/frontmatter";
import { getAllHeadingTitles, pathAcceptedString } from "./fast_link_edit/helper";
import { goToNextLink, getCurrentLinkIndex, navigatePaneToNextLink, navigatePaneToPreviousLink } from "./fast_link_edit/navigate";
import { toggleMetaTag } from "./fast_toggle_tags/meta";
import { createNotationNote } from "./notation";
import { ObsidianLink } from "./links";
import { ManageLinksModal } from "./manage_links/ManageLinksModal";
import { addHTMLCommands } from "./html/html";
import { sanitizeFilename } from "./files";
import { navigateToIndex } from "./navigate_index/navigate_index";
import { openNavigationPane } from "./fast_link_edit/navigate";
import * as path from 'path';
import * as fs from 'fs';
import { createFootnote } from "./footnotes";
import { createNotationNotes, linkNotats, nameDefsAndNotats } from "./run_python_script";
import { getReferenceName } from "./references";
import TrouverObs from "main";

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
    await addOpenParentVaultCommand(plugin);
    await addCreateFootnoteCommand(plugin);
    await addPythonCommands(plugin);
}

export async function addFastLinkEditCommands(plugin: TrouverObs) {
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
                    const referenceName = getReferenceName(plugin);
                    createNotationNote(plugin, referenceName, selection, currentFile);
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
        callback: async () => {
            const referenceName = await getReferenceName(plugin);
            await navigator.clipboard.writeText(`${referenceName}_`);
            new Notice(`Copied '${referenceName}_' to clipboard.`);
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

    const tags_and_keys = [
        ['_meta/definition', '1'],
        ['_meta/notation', '2'],
        ['_meta/concept', '3'],
        ['_meta/proof', '4'],
        ['_meta/narrative', '5'],
        ['_meta/exercise', '6'],
        ['_meta/remark', '7'],
        ['_meta/example', '8'],
        ['_meta/context', '9'],
        ['def_and_notat_identified', '0'],
        ['def_and_notat_names_added', '-'],
        ['notation_summary', '+'],
        ['_meta/notation_note_named', ']'],
        ['notation_notes_linked', '['],
    ];

    for (let i = 0; i < tags_and_keys.length; i++) {
        let tag = tags_and_keys[i][0];
        let key = tags_and_keys[i][1];
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

    const TODOTags = ['_meta/TODO/delete', '_meta/TODO/split', '_meta/TODO/merge',
                        '_meta/TODO/change_title', ];

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

export async function addIndexViewCommands(plugin: Plugin) {
    plugin.addCommand({
        id: 'open-pane-to-navigate-links-in-current-view',
        name: 'Open pane to navigate links in current view',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'Enter'}],
        editorCallback: async (editor: Editor) => {
            openNavigationPane(plugin, editor);
        }
    });

    plugin.addCommand({
        id: 'navigate-pane-to-next-link',
        name: 'Navigate pane to next link',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'j'}],
        checkCallback: (checking: boolean) => {
            return navigatePaneToNextLink(plugin, checking);
        }
    });
    plugin.addCommand({
        id: 'navigate-pane-to-previous-link',
        name: 'Navigate pane to previous link',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 'k'}],
        checkCallback: (checking: boolean) => {
            return navigatePaneToPreviousLink(plugin, checking);
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



export function addOpenParentVaultCommand(plugin: Plugin) {
  plugin.addCommand({
    id: 'open-parent-vault',
    name: 'Open Parent Vault',
    callback: async () => {
      const currentFile = plugin.app.workspace.getActiveFile();
      if (!currentFile) {
        new Notice('No active file');
        return;
      }

      const openedVaultPath = plugin.app.vault.adapter.getBasePath();
      const vaultPath = findParentVaultPath(currentFile.path, openedVaultPath);
    //   const vaultPath = 'hi'
      if (!vaultPath) {
        new Notice('No parent vault found');
        return;
      }

      if (vaultPath === plugin.app.vault.adapter.basePath) {
        new Notice('Already in the current vault');
        return;
      }

      try {
        console.log('hi');
        console.log(vaultPath);
        // await plugin.app.vault.adapter.exists(vaultPath);
        // await plugin.app.openVault(vaultPath);
        await openVault(vaultPath);
        console.log('hi again')
        new Notice(`Opened vault at ${vaultPath}`);
      } catch (error) {
        console.error('Error opening vault:', error);
        new Notice('Failed to open vault');
      }
    }
  });
}

async function openVault(vaultPath: string) {
    const { shell } = require('electron');
    // const encodedPath = encodeURIComponent(vaultPath);
    console.log('path');
    console.log(vaultPath);
    const vaultname = path.basename(vaultPath);
    // const obsidianUrl = `obsidian://open?vault=${encodedPath}`;
    const obsidianUrl = `obsidian://vault/${vaultname}`;
    console.log(obsidianUrl);
    // obsidian://open?vault=Playground&file=7_projective_representations%2Ffarkas_kopeliovich_kra_umc_17_1
    shell.openExternal(obsidianUrl);
  }

function findParentVaultPath(
    filePath: string,
    openedVaultPath: string,
    ): string | null {
  let currentDir = path.dirname(filePath);
  while (currentDir !== '.') {
    console.log(currentDir);
    const obsidianPath = path.join(currentDir, '.obsidian');
    const absolutePath = path.resolve(openedVaultPath, obsidianPath);
    if (fs.existsSync(absolutePath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}


export async function addCreateFootnoteCommand(plugin: Plugin) {
    plugin.addCommand({
        id: 'create-footnote',
        name: 'Create Footnote',
        hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
        editorCallback: (editor: Editor) => createFootnote(editor)
    });

}

export async function addPythonCommands(plugin: TrouverObs) {
    plugin.addCommand({
        id: 'create-notation-notes',
        name: 'Create notation notes (no deletions, auto summary, and auto name generation)',
        // hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
        editorCallback: async (editor: Editor) => {
            try {
                new Notice(`Creating, summarizing, and naming notation notes`);
                const activeFile = plugin.app.workspace.getActiveFile();
                const fileName = activeFile.name;
                // Ensure createNotationNotes returns a promise that resolves when all operations are complete
                await createNotationNotes(plugin);
                new Notice(`Notation notes created, summarized, and named for ${fileName}.`);
            } catch (error) {
                console.error('Error in create-notation-notes command:', error);
                new Notice('An error occurred while creating notation notes');
            }
        }
    })

    plugin.addCommand({
        id: 'name-defs-and-notats',
        name: 'Name definitions and notations in HTML tags',
        // hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
        editorCallback: async (editor: Editor) => {
            try {
                new Notice(`Naming definitions and notations in HTML tags`);
                const activeFile = plugin.app.workspace.getActiveFile();
                const fileName = activeFile.name;
                // Ensure createNotationNotes returns a promise that resolves when all operations are complete
                await nameDefsAndNotats(plugin);
                new Notice(`Definitions and notations named in ${fileName}.`);
            } catch (error) {
                console.error('Error in create-notation-notes command:', error);
                new Notice('An error occurred while creating notation notes');
            }
        }
    })


    plugin.addCommand({
        id: 'notation-note-linking',
        name: 'Link notation notes to current notation note',
        // hotkeys: [{modifiers: ['Shift', 'Alt'], key: 't'}],
        editorCallback: async (editor: Editor) => {
            try {
                new Notice(`Linking notation notes`);
                const activeFile = plugin.app.workspace.getActiveFile();
                const fileName = activeFile.name;
                // Ensure createNotationNotes returns a promise that resolves when all operations are complete
                await linkNotats(plugin);
                new Notice(`Notation notes linked in ${fileName}.`);
            } catch (error) {
                console.error('Error in notation-note-linking command:', error);
                new Notice('An error occurred while linking notation notes');
            }
        }
    })
}