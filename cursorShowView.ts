import { ItemView, WorkspaceLeaf } from "obsidian";

export const CURSOR_SHOW_VIEW_TYPE = "cursor-show-view";

export class CursorShowView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return CURSOR_SHOW_VIEW_TYPE;
    }

    getDisplayText() {
        return "Cursor Show View";
    }

    async onOpen() {
        console.log('CursorShowView opened.');
        const container = this.containerEl.children[1];
        container.empty();
        // container.createEl("h4", { text: "Example view" });
    }

    async onClose() {

    }
}