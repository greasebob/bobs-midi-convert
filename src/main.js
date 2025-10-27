/**
 * YouTube to MIDI Converter - Main Application
 * Client-side audio-to-MIDI transcription using Magenta.js
 */

import { FileHandler } from './modules/fileHandler.js';
import { YouTubeDownloader } from './modules/youtubeDownloader.js';
import { AudioProcessor } from './modules/audioProcessor.js';
import { PianoTranscription } from './modules/pianoTranscription.js';
import { MIDIGenerator } from './modules/midiGenerator.js';
import { UIController } from './modules/uiController.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Initialize modules
const ui = new UIController();
const fileHandler = new FileHandler();
const youtubeDownloader = new YouTubeDownloader();
const audioProcessor = new AudioProcessor();
const pianoTranscription = new PianoTranscription();
const midiGenerator = new MIDIGenerator();

// Global state
let outputMIDIPaths = [];
let cancelRequested = false;

/**
 * Initialize application
 */
function init() {
  // Initialize UI
  ui.init();

  // Setup file upload handlers
  fileHandler.setupHandlers(
    ui.elements.uploadZone,
    ui.elements.fileInput,
    (files) => ui.showFileInfo(files)
  );

  // Setup button handlers
  ui.elements.convertBtn.addEventListener('click', startConversion);
  ui.elements.cancelBtn.addEventListener('click', cancelConversion);
  ui.elements.downloadBtn.addEventListener('click', downloadMIDI);

  // Setup settings toggle
  document.querySelector('.collapsible-header').addEventListener('click', () => {
    ui.toggleSettings();
  });

  console.log('YouTube to MIDI Converter initialized');
  ui.addLog('Ready to convert audio to MIDI!');
}

/**
 * Start conversion process
 */
async function startConversion() {
  try {
    // Reset state
    cancelRequested = false;
    outputMIDIPaths = [];

    // Update UI
    ui.startConversion();
    ui.addLog('🔄 Starting conversion...');

    // Get settings
    const settings = ui.getSettings();

    // Prepare audio sources
    const audioSources = [];

    // Get YouTube URLs
    if (settings.youtubeUrls.trim()) {
      const urls = youtubeDownloader.parseUrls(settings.youtubeUrls);
      ui.addLog(`Found ${urls.length} YouTube URL(s)`);

      // Download YouTube audio
      for (let i = 0; i < urls.length; i++) {
        if (cancelRequested) break;

        ui.updateProgress(i, urls.length);

        try {
          const result = await youtubeDownloader.downloadAudio(
            urls[i],
            (msg) => ui.addLog(msg)
          );

          audioSources.push({
            buffer: result.buffer,
            name: result.filename.replace('.mp3', ''),
            type: 'youtube'
          });

        } catch (error) {
          ui.addLog(`Failed to download ${urls[i]}: ${error.message}`, 'error');
        }
      }
    }

    // Get local files
    const selectedFiles = fileHandler.getSelectedFiles();
    if (selectedFiles.length > 0) {
      ui.addLog(`Found ${selectedFiles.length} local file(s)`);

      for (const file of selectedFiles) {
        if (cancelRequested) break;

        const buffer = await fileHandler.readFileAsArrayBuffer(file);
        audioSources.push({
          buffer: buffer,
          name: fileHandler.getFileNameWithoutExtension(file),
          type: 'file'
        });
      }
    }

    if (audioSources.length === 0) {
      ui.addLog('No audio sources provided!', 'error');
      ui.endConversion();
      return;
    }

    ui.addLog(`Processing ${audioSources.length} audio file(s)...`);

    // Process each audio file
    const results = [];

    for (let i = 0; i < audioSources.length; i++) {
      if (cancelRequested) {
        ui.addLog('🛑 Conversion cancelled', 'warning');
        break;
      }

      const source = audioSources[i];

      ui.addLog(`\n📄 Processing ${i + 1}/${audioSources.length}: ${source.name}`);
      ui.updateProgress(i, audioSources.length);

      try {
        // Load and process audio
        ui.addLog('Loading audio...');
        let audioBuffer = await audioProcessor.loadAudio(
          source.buffer,
          (msg) => ui.addLog(msg)
        );

        // Apply trimming if needed
        if (settings.startTime > 0 || settings.endTime > 0) {
          ui.addLog(`Trimming audio (${settings.startTime}s to ${settings.endTime || 'end'}s)`);
          audioBuffer = audioProcessor.trimAudio(
            audioBuffer,
            settings.startTime,
            settings.endTime > 0 ? settings.endTime : null
          );
        }

        // Resample to 16kHz for Magenta.js
        const requiredSampleRate = pianoTranscription.getRequiredSampleRate();
        ui.addLog(`Resampling audio to ${requiredSampleRate}Hz...`);
        audioBuffer = await audioProcessor.resampleAudio(audioBuffer, requiredSampleRate);

        // Get audio samples
        const audioSamples = audioProcessor.getAudioSamples(audioBuffer);

        // Transcribe
        ui.addLog('🎹 Transcribing with Piano Transcription model...');
        const noteSequence = await pianoTranscription.transcribe(
          audioSamples,
          (msg) => ui.addLog(msg)
        );

        // Generate MIDI
        ui.addLog('🎵 Generating MIDI file...');
        const midiData = midiGenerator.generateMIDI(noteSequence, {
          maxNoteDuration: settings.maxNotes,
          enableMaxNotesFilter: settings.enableMaxNotes
        });

        // Determine filename
        let filename = source.name;
        if (settings.customTitle && audioSources.length === 1) {
          filename = settings.customTitle;
        } else if (settings.customTitle && audioSources.length > 1) {
          filename = `${settings.customTitle}_${i + 1}`;
        }

        filename = midiGenerator.sanitizeFilename(filename);

        results.push({
          midiData: midiData,
          filename: filename,
          audioBuffer: source.buffer,
          noteCount: midiGenerator.getNoteCount(noteSequence)
        });

        ui.addLog(`✅ Completed: ${filename} (${midiGenerator.getNoteCount(noteSequence)} notes)`);

      } catch (error) {
        ui.addLog(`❌ Failed to process ${source.name}: ${error.message}`, 'error');
        console.error(error);
      }

      ui.updateProgress(i + 1, audioSources.length);
    }

    // Handle outputs
    if (results.length > 0) {
      outputMIDIPaths = results;

      if (results.length === 1) {
        // Single file - direct download
        ui.addLog('\n💾 Ready to download!');
        ui.showDownloadButton();

      } else {
        // Multiple files
        if (settings.zipOutput) {
          ui.addLog('\n📦 Packaging files into ZIP...');

          const zip = new JSZip();

          // Add MIDI files
          results.forEach(result => {
            zip.file(result.filename, result.midiData);
          });

          // Add MP3 files if requested
          if (settings.includeMp3) {
            ui.addLog('Adding audio files to ZIP...');
            results.forEach((result) => {
              const audioName = result.filename.replace('.mid', '.mp3');
              zip.file(audioName, result.audioBuffer);
            });
          }

          ui.addLog('✅ ZIP file ready for download!');
        } else {
          ui.addLog('\n💾 Ready to download multiple files!');
        }

        ui.showDownloadButton();
      }

      ui.addLog(`\n🎉 All conversions complete! Processed ${results.length} file(s).`);

    } else {
      ui.addLog('No files were successfully converted.', 'warning');
    }

  } catch (error) {
    ui.addLog(`❌ Error: ${error.message}`, 'error');
    console.error(error);

  } finally {
    ui.endConversion();
  }
}

/**
 * Cancel conversion
 */
function cancelConversion() {
  cancelRequested = true;
  ui.addLog('🛑 Cancelling...', 'warning');
  ui.elements.cancelBtn.disabled = true;
}

/**
 * Download MIDI files
 */
async function downloadMIDI() {
  try {
    if (outputMIDIPaths.length === 0) {
      ui.addLog('No files to download', 'error');
      return;
    }

    const settings = ui.getSettings();

    if (outputMIDIPaths.length === 1) {
      // Single file download
      const result = outputMIDIPaths[0];
      midiGenerator.saveMIDI(result.midiData, result.filename);
      ui.addLog(`Downloaded: ${result.filename}`);

    } else {
      // Multiple files
      if (settings.zipOutput) {
        // Download as ZIP
        ui.addLog('Generating ZIP file...');

        const zip = new JSZip();

        // Add MIDI files
        outputMIDIPaths.forEach(result => {
          zip.file(result.filename, result.midiData);
        });

        // Add MP3 files if requested
        if (settings.includeMp3) {
          outputMIDIPaths.forEach(result => {
            const audioName = result.filename.replace('.mid', '.mp3');
            zip.file(audioName, result.audioBuffer);
          });
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipFilename = midiGenerator.sanitizeFilename(settings.zipFilename || 'midi_files') + '.zip';

        saveAs(zipBlob, zipFilename);
        ui.addLog(`Downloaded: ${zipFilename}`);

      } else {
        // Download each file separately
        outputMIDIPaths.forEach(result => {
          midiGenerator.saveMIDI(result.midiData, result.filename);
        });
        ui.addLog(`Downloaded ${outputMIDIPaths.length} MIDI files`);
      }
    }

  } catch (error) {
    ui.addLog(`Download error: ${error.message}`, 'error');
    console.error(error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
