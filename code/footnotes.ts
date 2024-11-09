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

  // Move cursor to the closing bracket of the footnote reference
  editor.setCursor({
    line: referenceInsertPosition.line,
    ch: referenceInsertPosition.ch + footnoteReference.length - 1
  });

  // Insert new footnote content
  const footnoteContent = `[^${leastUnusedNumber}]:`;
  let insertLine = cursor.line + 1;
  const lines = noteContent.split('\n');

  // Find the appropriate insertion point
  while (insertLine < lines.length && lines[insertLine].trim() === '') {
    insertLine++;
  }

  if (insertLine < lines.length && lines[insertLine].match(/^\[\^\d+\]:/)) {
    // If there's already a footnote, insert before it without extra newline
    editor.replaceRange(`${footnoteContent}\n`, {line: insertLine, ch: 0});
  } else {
    // If there's no footnote, add a newline before and after
    editor.replaceRange(`\n${footnoteContent}\n`, {line: insertLine, ch: 0});
  }

  // Add a blank line after the first footnote reference if it's the first one
  if (usedNumbers.size === 0) {
    editor.replaceRange('\n', {
      line: referenceInsertPosition.line,
      ch: referenceInsertPosition.ch + footnoteReference.length
    });
  }
}
