let wikilink_re = /!?\[\[([^#\|]*?)(#(.*?))?(\|(.*?))?\]\]/
let markdown_re = /!?\[([^\]]*)\]\(([^)#]+)(#([^)]+))?\)/
/**
 * See the Python package trove.markdown.obsidian.links.
 * 
 */
// TODO: this is implemented in trouver. Maybe replace with the implementation there. 

export class LinkFormatError extends Error {
    constructor(message: string){
        super(`Link is not formatted properly: ${message}`);
        this.name = 'LinkFormatError';
    }
}

export enum LinkType {
    Wikilink,
    Markdown
}

export class ObsidianLink {
    is_embedded: boolean;
    file_name: string;
    anchor: string | number;
    custom_text: string | number;
    link_type: LinkType;
    
    constructor(is_embedded: boolean, file_name: string, anchor: string | number, custom_text: string | number, link_type: LinkType){
        this.is_embedded = is_embedded;
        this.file_name = file_name;
        this.anchor = anchor;
        this.custom_text = custom_text;
        this.link_type = link_type;
    }

    static fromText(text: string): ObsidianLink{
        let is_embedded = text.startsWith('!');
        let matches = text.match(wikilink_re);
        let file_name, anchor, custom_text, link_type;
        if (matches){
            file_name = matches[1];
            anchor = matches[3];
            custom_text = matches[5];
            link_type = LinkType.Wikilink;
        } else {
            matches = text.match(markdown_re);
            if (!matches){
                // Raise error
            }
            file_name = matches[2].replace('%20', ' ');
            anchor = matches[4];
            if (anchor){
                anchor = anchor.replace('%20', ' ');
                custom_text = matches[1];
                link_type = LinkType.Markdown;
            }
        }
        if (anchor == undefined){
            anchor = 0;
        }
        if (custom_text == undefined){
            custom_text = 0;
        }
        return new ObsidianLink(is_embedded, file_name, anchor, custom_text, link_type);
    }

    /**
     * 
     * @returns {string}
     */
    displayText(): string{
        if (this.custom_text) {
            return String(this.custom_text);
        } else {
            return this.file_name;  // TODO This doesn't actually return the display text.
        }
    }

}