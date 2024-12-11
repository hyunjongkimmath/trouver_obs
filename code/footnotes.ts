import { Editor } from "obsidian";




export async function createFootnote(editor: Editor) {
  const noteContent = editor.getValue();
  const footnoteRegex = /\[\^(\d+)\]:/g;
  const usedNumbers = new Set();

  let match;
  while ((match = footnoteRegex.exec(noteContent)) !== null) {
    usedNumbers.add(parseInt(match[1]));
  }

  let leastUnusedNumber = 1;
  while (usedNumbers.has(leastUnusedNumber)) {
    leastUnusedNumber++;
  }

  // Insert footnote reference
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const referenceInsertPosition = {
    line: cursor.line,
    ch: cursor.ch + (cursor.ch < line.length ? 1 : 0)
  };

  const footnoteReference = `[^${leastUnusedNumber}]`;
  editor.replaceRange(footnoteReference, referenceInsertPosition);

  // Keep cursor right after the inserted footnote reference
  editor.setCursor({
    line: referenceInsertPosition.line,
    ch: referenceInsertPosition.ch + footnoteReference.length - 1
  });

  // Insert new footnote content
  const footnoteContent = `[^${leastUnusedNumber}]:`;
  let insertLine = cursor.line + 1;
  const lines = noteContent.split('\n');

  // Find the end of the current paragraph
  while (insertLine < lines.length && lines[insertLine].trim() !== '') {
    insertLine++;
  }

  // Check for existing footnote content
  let existingFootnoteIndex = -1;
  for (let i = insertLine; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    if (lines[i].match(/^\[\^\d+\]:/)) {
      existingFootnoteIndex = i;
      break;
    }
    if (lines[i].trim() !== '') break; // Stop if we hit non-empty, non-footnote content
  }

  if (existingFootnoteIndex !== -1) {
    // Insert new footnote content immediately above existing footnote
    editor.replaceRange(`${footnoteContent}\n`, {line: existingFootnoteIndex, ch: 0});
  } else {
    // Insert new footnote content after the current paragraph with blank lines
    editor.replaceRange(`\n\n${footnoteContent}\n`, {line: insertLine, ch: 0});
  }

  // Cursor remains where it was set after inserting the footnote reference
}
