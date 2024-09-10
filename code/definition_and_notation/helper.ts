import { parse } from 'node-html-parser';
import { TFile, Vault } from 'obsidian';

/**
 * Parse the HTML tags in the file to read-off the "names" of the
 * definitions present in the file.
 * @param vault 
 * @param file 
 * @returns string[]
 */
export async function getAllDefinitions(
        vault: Vault, file: TFile): string[] {
    const text = await vault.read(file);
    const html_parse_result = parse(text);
    var definitions = [];
    html_parse_result.childNodes.forEach(function(childNode){
        if (!childNode.rawAttributes || !childNode.rawAttributes.definition){
            return
        }
        const definitionsFromNode = childNode.rawAttributes.definition.split(';');
        definitions.push(...definitionsFromNode);
    });
    return definitions
    // for html_parse_result.childNodes
}