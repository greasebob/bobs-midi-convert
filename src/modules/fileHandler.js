/**
 * File Handler Module
 * Handles local file uploads (drag-and-drop, file selection)
 */

export class FileHandler {
  constructor() {
    this.selectedFiles = [];
    this.supportedFormats = [
      'audio/mpeg',        // MP3
      'audio/wav',         // WAV
      'audio/x-wav',       // WAV (alternative)
      'audio/flac',        // FLAC
      'audio/x-flac',      // FLAC (alternative)
      'audio/m4a',         // M4A
      'audio/mp4',         // M4A/MP4
      'audio/ogg',         // OGG
      'audio/webm',        // WebM
      'audio/aac',         // AAC
    ];
  }

  /**
   * Set up file upload handlers
   */
  setupHandlers(uploadZone, fileInput, onFilesSelected) {
    // Click to browse
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files), onFilesSelected);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');

      const files = Array.from(e.dataTransfer.files);
      this.handleFiles(files, onFilesSelected);
    });
  }

  /**
   * Handle selected files
   */
  handleFiles(files, callback) {
    // Filter only audio files
    const audioFiles = files.filter(file => this.isAudioFile(file));

    if (audioFiles.length === 0) {
      alert('Please select valid audio files (MP3, WAV, FLAC, M4A, OGG, etc.)');
      return;
    }

    if (audioFiles.length !== files.length) {
      const skipped = files.length - audioFiles.length;
      console.warn(`Skipped ${skipped} non-audio file(s)`);
    }

    this.selectedFiles = audioFiles;

    if (callback) {
      callback(audioFiles);
    }
  }

  /**
   * Check if file is a supported audio format
   */
  isAudioFile(file) {
    // Check MIME type
    if (this.supportedFormats.includes(file.type)) {
      return true;
    }

    // Check file extension as fallback
    const extension = file.name.split('.').pop().toLowerCase();
    const audioExtensions = ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm', 'aac', 'opus'];
    return audioExtensions.includes(extension);
  }

  /**
   * Read file as ArrayBuffer
   */
  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = (error) => {
        reject(new Error(`Failed to read file: ${error.message}`));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Read multiple files as ArrayBuffers
   */
  async readMultipleFiles(files) {
    const promises = files.map(file => this.readFileAsArrayBuffer(file));
    return Promise.all(promises);
  }

  /**
   * Get file name without extension
   */
  getFileNameWithoutExtension(file) {
    return file.name.replace(/\.[^/.]+$/, '');
  }

  /**
   * Get selected files
   */
  getSelectedFiles() {
    return this.selectedFiles;
  }

  /**
   * Clear selected files
   */
  clearSelectedFiles() {
    this.selectedFiles = [];
  }
}
