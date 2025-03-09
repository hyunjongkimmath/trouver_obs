import TrouverObs from "main";
import { Plugin } from "obsidian";
import { getReferenceName } from "./references";

const { exec } = require('child_process');
const path = require('path');

export async function runPythonScript(
    plugin: TrouverObs,
    scriptPath,
    args) {
  return new Promise((resolve, reject) => {
    const venvPath = plugin.settings.venvPath;

    // Determine the Python executable based on the OS
    let pythonExecutable;
    if (process.platform === 'win32') {
      pythonExecutable = path.join(venvPath, 'Scripts', 'python.exe');
    } else {
      pythonExecutable = path.join(venvPath, 'bin', 'python');
    }

    // Sanitize arguments by quoting each one
    const sanitizedArgs = args.map(arg => `"${arg}"`).join(' ');
    // Construct the command
    const command = `"${pythonExecutable}" "${scriptPath}" ${sanitizedArgs}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}


export async function passToScript(
    plugin: TrouverObs,
    scriptName: string,
    args
    ) {
  try {
    const scriptPath = pathToScript(plugin, scriptName);
    const result = await runPythonScript(plugin, scriptPath, args);
    console.log('Logging from Python script:');
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error running Python script:', error);
  }
}

export function pathToScript(
    plugin: TrouverObs,
    // vaultPath: string,
    scriptName: string,
    ){
    // Get the vault's base path
    const adapter = plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath(); // Get the root directory of the vault

    // Construct the full path to the Python script
    const scriptPath = path.join(vaultPath, '.obsidian', 'scripts', 'python', scriptName);
    return scriptPath
}



export async function createNotationNotes(
    plugin: TrouverObs,
){
    // console.log('hi')
    const adapter = plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath(); // Get the root directory of the vault
    const activeFile = plugin.app.workspace.getActiveFile();
    const filePath = activeFile.path;
    const referenceName = await getReferenceName(plugin);

    try {
        // Await the passToScript function
        await passToScript(plugin, 'create_notation_notes.py', [vaultPath, filePath, referenceName]);
    } catch (error) {
        console.error('Error in createNotationNotes:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
    // passToScript(plugin, 'create_notation_notes.py', [vaultPath, filePath, referenceName])

}

export async function nameDefsAndNotats(
    plugin: TrouverObs,
){
    // console.log('hi')
    const adapter = plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath(); // Get the root directory of the vault
    const activeFile = plugin.app.workspace.getActiveFile();
    const filePath = activeFile.path;
    const referenceName =  await getReferenceName(plugin)

    try {
        // Await the passToScript function
        await passToScript(plugin, 'name_defs_and_notats.py', [vaultPath, filePath, referenceName]);
    } catch (error) {
        console.error('Error in createNotationNotes:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
    // passToScript(plugin, 'create_notation_notes.py', [vaultPath, filePath, referenceName])

}

export async function linkNotats(
    plugin: TrouverObs,
){
    // console.log('hi')
    const adapter = plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath(); // Get the root directory of the vault
    const activeFile = plugin.app.workspace.getActiveFile();
    const filePath = activeFile.path;
    const referenceName =  await getReferenceName(plugin)

    try {
        // Await the passToScript function
        await passToScript(plugin, 'link_notations.py', [vaultPath, filePath, referenceName]);
    } catch (error) {
        console.error('Error in createNotationNotes:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
    // passToScript(plugin, 'create_notation_notes.py', [vaultPath, filePath, referenceName])

}

export async function getProcessedContentOfNote(
    plugin: TrouverObs,
){

    const adapter = plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath(); // Get the root directory of the vault
    const activeFile = plugin.app.workspace.getActiveFile();
    const filePath = activeFile.path;
    const referenceName =  await getReferenceName(plugin)

    try {
        // Await the passToScript function
        const result = await passToScript(plugin, 'get_processed_note_content.py', [vaultPath, filePath, referenceName]);
        await navigator.clipboard.writeText(`${result}`);

    } catch (error) {
        console.error('Error in getProcessedContentOfNote:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
    // passToScript(plugin, 'create_notation_notes.py', [vaultPath, filePath, referenceName])


}