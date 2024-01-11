import { MarkdownView, Plugin, TFile } from "obsidian";
import { pathAcceptedString } from "./fast_link_edit/helper";

/**
 * Creates a Notation note, add the phrase '<notation> denotes' with the string
 * 'denotes' linking to the current workspace index note.
 * 
 * TODO add a link of the notation note to the main file.
 * 
 * @param {string} referenceName e.g. arapura_CAV
 * @param {string} notation e.g. H_i_et_X_F
 * @param {TFile} mainFile the information note that the notation comes from.
 */
export async function createNotationNote(
        plugin: Plugin,
        referenceName: string,
        notation: string,
        mainFile: TFile): Promise<void> {
    const notationForPath = pathAcceptedString(notation);
    const path = mainFile.parent.path;
    const fileName = `${path}/${referenceName}_notation_${notationForPath}`
    let filePath;
    if (await plugin.app.vault.adapter.exists(`${fileName}.md`)) {
        let num = 0;
        while (await plugin.app.vault.adapter.exists(`${fileName}_${num}.md`)) {
            num++;
        }
        filePath = `${fileName}_${num}.md`;
    } else {
        filePath = `${fileName}.md`;
    }
    const file = await plugin.app.vault.create(filePath, '');
    const text = `${notation} [[${mainFile.basename}|denotes]] `
    await plugin.app.vault.modify(file, text);
    const newLeaf = plugin.app.workspace.splitActiveLeaf();
    await newLeaf.openFile(file);
    plugin.app.workspace.setActiveLeaf(newLeaf, true, true);
    const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const pos: EditorPosition = {
        line: 0,
        ch: text.length
    }
    view.editor.setCursor(pos);
}