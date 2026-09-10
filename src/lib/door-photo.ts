const LINE = /^door:(\S+)/m;

export function doorPhotoFromNotes(notes: string) {
  return notes.match(LINE)?.[1] || "";
}

export function notesWithoutDoor(notes: string) {
  return notes.replace(LINE, "").replace(/^\n/, "").trim();
}

export function withDoorPhoto(notes: string, url: string) {
  const rest = notesWithoutDoor(notes);
  const clean = url.trim();
  return clean ? `door:${clean}${rest ? `\n${rest}` : ""}` : rest;
}
