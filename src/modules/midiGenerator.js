/**
 * MIDI Generator Module
 * Converts note sequences to MIDI files using @tonejs/midi
 */

import { Midi } from '@tonejs/midi';
import { saveAs } from 'file-saver';

export class MIDIGenerator {
  constructor() {
    this.defaultVelocity = 64;
  }

  /**
   * Convert Magenta NoteSequence to MIDI file
   * @param {Object} noteSequence - Magenta.js NoteSequence
   * @param {Object} options - Generation options
   * @returns {Uint8Array} - MIDI file data
   */
  generateMIDI(noteSequence, options = {}) {
    const {
      maxNoteDuration = null,
      enableMaxNotesFilter = true,
    } = options;

    // Create new MIDI file
    const midi = new Midi();
    const track = midi.addTrack();

    // Filter and add notes
    let notes = noteSequence.notes || [];

    if (enableMaxNotesFilter && maxNoteDuration !== null) {
      notes = this.filterByDuration(notes, maxNoteDuration);
    }

    // Add each note to the track
    notes.forEach(note => {
      const duration = note.endTime - note.startTime;

      track.addNote({
        midi: note.pitch,
        time: note.startTime,
        duration: duration,
        velocity: note.velocity !== undefined ? note.velocity / 127 : this.defaultVelocity / 127
      });
    });

    // Convert to array (MIDI bytes)
    return midi.toArray();
  }

  /**
   * Filter notes by maximum duration
   */
  filterByDuration(notes, maxDuration) {
    return notes.filter(note => {
      const duration = note.endTime - note.startTime;
      return duration <= maxDuration;
    });
  }

  /**
   * Save MIDI file to disk
   */
  saveMIDI(midiData, filename) {
    const blob = new Blob([midiData], { type: 'audio/midi' });
    saveAs(blob, this.sanitizeFilename(filename));
  }

  /**
   * Generate and save MIDI file
   */
  generateAndSave(noteSequence, filename, options = {}) {
    const midiData = this.generateMIDI(noteSequence, options);
    this.saveMIDI(midiData, filename);
    return midiData;
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    // Ensure .mid extension
    if (!filename.endsWith('.mid')) {
      filename += '.mid';
    }

    // Remove invalid characters
    return filename
      .replace(/[^\w\s-]/g, '')
      .replace(/[-\s]+/g, '_')
      .substring(0, 200);
  }

  /**
   * Get note count from NoteSequence
   */
  getNoteCount(noteSequence) {
    return noteSequence.notes ? noteSequence.notes.length : 0;
  }

  /**
   * Get duration from NoteSequence
   */
  getDuration(noteSequence) {
    if (!noteSequence.notes || noteSequence.notes.length === 0) {
      return 0;
    }

    const lastNote = noteSequence.notes.reduce((latest, note) => {
      return note.endTime > latest ? note.endTime : latest;
    }, 0);

    return lastNote;
  }

  /**
   * Create MIDI blob for download or ZIP
   */
  createMIDIBlob(midiData) {
    return new Blob([midiData], { type: 'audio/midi' });
  }
}
