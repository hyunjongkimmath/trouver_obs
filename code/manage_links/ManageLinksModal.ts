import { App, Modal, Notice, parseLinktext, Setting, stringifyYaml, TFile } from "obsidian";
import { ObsidianLink } from "code/links";

export class ManageLinksModal extends Modal {
    changesToMake: Record<string, string>;

    constructor(app: App) {
        super(app);
        this.changesToMake = {};
    }

    onOpen() {
        let {contentEl } = this;
        
        const backlinks = getLinkVarieties(this.app, this.app.workspace.getActiveFile());
        //console.log(backlinks);

        contentEl.createEl("h1", { text: "Replace backlinks" });

        for (const linkVariety in backlinks){
            new Setting(contentEl)
                .setName(linkVariety)
                .addText((text) => {
                    text.setValue(linkVariety);
                    text.onChange((value) => {
                        this.changesToMake[linkVariety] = value
                    })});
        }

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Replace backlinks")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(backlinks);
                        new Notice('Backlinks replaced!');
                    }));

    }
    onClose() {
        let {contentEl } = this;
        contentEl.empty();
    }

    async onSubmit(linkVarieties: Record<string, Set<string>>): Promise<void> {
        //console.log(linkVarieties);
        //console.log(this.changesToMake);
        for (const linkVariety in linkVarieties) {
            if (this.changesToMake[linkVariety] == linkVariety || !(linkVariety in this.changesToMake)) {
                continue;
            }
            const re = linkToRegex(linkVariety);
            const filesToChange = linkVarieties[linkVariety]
            //console.log(filesToChange);
            for (let file of filesToChange.values()) {
                const tfile = this.app.metadataCache.getFirstLinkpathDest(file, '');
                let fileContent = await this.app.vault.read(tfile);
                fileContent = fileContent.replace(re, this.changesToMake[linkVariety]);
                await this.app.vault.modify(tfile, fileContent);
            }
        }
    }
}

/**
 * Returns the varieties of backlinks of a file, along with sets of files
 * containing such backlinks.
 * @param {App} app The Obsidian app.
 * @param {TFile} forFile The file whose 
 * @returns {Record<string, Set<string>}
 */
function getLinkVarieties(app: App, forFile: TFile): Record<string, Set<string>> {
    const linkVarieties: Record<string, Set<string>> = {};
    const resolvedLinks = app.metadataCache.resolvedLinks;
    for (const file in resolvedLinks){
        const fileLinks = resolvedLinks[file];
        if (!(forFile.path in fileLinks)){
            continue;
        }
        //console.log(file);
        const backLinkFile = app.metadataCache.getFirstLinkpathDest(file, '');
        const fileCache = app.metadataCache.getFileCache(backLinkFile);
        //console.log(fileCache);
        fileCache.links.forEach((link) => {
            const parsedLink = ObsidianLink.fromText(link.original);
            //console.log(parsedLink);
            if (app.metadataCache.getFirstLinkpathDest(parsedLink.file_name, '') != forFile){
                return;
            }
            if (!(link.original in linkVarieties)) {
                linkVarieties[link.original] = new Set<string>();
            }
            linkVarieties[link.original].add(file);
        });
        
    }
    return linkVarieties;
}



/**
 * Returns a new Record in which obtained by removing the keys which are the same as their
 * corresponding values. This is implemented for the `onSubmit` method of the `ManageLinkModal` class.
 * @param {Record<string, string>} changesToMake 
 * @returns {Record<string, string>}
 */
/*
function nontrivialChanges(changesToMake: Record<string, string>): Record<string, string> {
    const toReturn: Record<string, string> = {};
    for (const linkVariety in changesToMake){
        if (changesToMake[linkVariety] == linkVariety){
            continue;
        }
        toReturn[linkVariety] = changesToMake[linkVariety];
    }
    return toReturn;
}
*/

function linkToRegex(link: string): RegExp {
    link = link.replace(/\[/g, '\\[');
    link = link.replace(/\]/g, '\\]');
    link = link.replace(/\(/g, '\\(');
    link = link.replace(/\)/g, '\\)');
    link = link.replace(/\|/g, '\\|');
    return RegExp(link, 'g');
}