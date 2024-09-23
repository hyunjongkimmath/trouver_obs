
import { TFile, MarkdownView, Plugin } from 'obsidian';

export async function navigateToIndex(plugin: Plugin) {
    const currentFile = plugin.app.workspace.getActiveFile();
    if (!currentFile) return;

    const indexFile = await findIndexFile(currentFile);
    console.log(indexFile);
    if (!indexFile) {
      console.log('No index file found');
      return;
    }

    await plugin.app.workspace.getLeaf().openFile(indexFile);
    highlightCurrentFileLink(plugin, currentFile, indexFile);
}

export async function findIndexFile(file: TFile): Promise<TFile | null> {
    let currentDir;

    // If the current file is an index file, start from its parent directory
    if (file.name.startsWith('_index')) {
        currentDir = file.parent?.parent;
    } else {
        currentDir = file.parent;
    }

    console.log(currentDir);

    while (currentDir) {
        const indexFile = currentDir.children.find(f => 
            f instanceof TFile && f.name.startsWith('_index')
        ) as TFile | undefined;

        if (indexFile) return indexFile;
        currentDir = currentDir.parent;
    }

    return null;
}

  export async function highlightCurrentFileLink(plugin: Plugin, currentFile: TFile, indexFile: TFile) {
    const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const content = await plugin.app.vault.read(indexFile);
    const linkRegex = new RegExp(`\\[\\[${currentFile.basename}(\\|.*?)?\\]\\]`);
    const match = content.match(linkRegex);

    if (match && match.index !== undefined) {
      const cursorPos = editor.offsetToPos(match.index);
      editor.setCursor(cursorPos);
      editor.scrollIntoView({ from: cursorPos, to: cursorPos }, true);
    }
  }