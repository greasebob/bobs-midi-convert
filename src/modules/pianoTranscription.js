/**
 * Piano Transcription Module
 * Uses Magenta.js OnsetsAndFrames model for piano transcription
 */

import * as mm from '@magenta/music';

export class PianoTranscription {
  constructor() {
    this.model = null;
    this.modelLoaded = false;
    this.sampleRate = 16000;  // Magenta.js expects 16kHz audio
  }

  /**
   * Initialize the OnsetsAndFrames model
   */
  async initialize(onProgress = null) {
    if (this.modelLoaded) {
      return this.model;
    }

    try {
      if (onProgress) {
        onProgress('Loading Piano Transcription model...');
        onProgress('This may take a moment on first load (~50MB download)');
      }

      // Initialize OnsetsAndFrames model
      // The model will be downloaded from CDN on first use
      this.model = new mm.OnsetsAndFrames(
        'https://storage.googleapis.com/magentadata/js/checkpoints/transcription/onsets_frames_uni'
      );

      await this.model.initialize();

      this.modelLoaded = true;

      if (onProgress) {
        onProgress('Piano Transcription model loaded successfully!');
      }

      return this.model;

    } catch (error) {
      console.error('Failed to load transcription model:', error);
      throw new Error(`Model initialization failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio to MIDI notes
   * @param {Float32Array} audioSamples - Audio samples at 16kHz sample rate
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<NoteSequence>} - Magenta.js NoteSequence object
   */
  async transcribe(audioSamples, onProgress = null) {
    if (!this.modelLoaded) {
      await this.initialize(onProgress);
    }

    try {
      if (onProgress) {
        onProgress('Transcribing audio to MIDI...');
        onProgress('This may take a few moments depending on audio length');
      }

      // Transcribe the audio
      const noteSequence = await this.model.transcribeFromAudioArray(audioSamples);

      if (onProgress) {
        const noteCount = noteSequence.notes ? noteSequence.notes.length : 0;
        onProgress(`Transcription complete! Found ${noteCount} notes`);
      }

      return noteSequence;

    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Get required sample rate for the model
   */
  getRequiredSampleRate() {
    return this.sampleRate;
  }

  /**
   * Check if model is loaded
   */
  isLoaded() {
    return this.modelLoaded;
  }

  /**
   * Dispose of the model (free memory)
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.modelLoaded = false;
    }
  }
}
