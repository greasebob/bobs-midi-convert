/**
 * Audio Processor Module
 * Handles audio loading, conversion, and trimming using Web Audio API and ffmpeg.wasm
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.ffmpeg = null;
    this.ffmpegLoaded = false;
  }

  /**
   * Initialize audio context
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Initialize FFmpeg.wasm
   */
  async initFFmpeg(onProgress = null) {
    if (this.ffmpegLoaded) {
      return this.ffmpeg;
    }

    if (onProgress) {
      onProgress('Loading FFmpeg...');
    }

    this.ffmpeg = new FFmpeg();

    // Set up logging
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // Set up progress tracking
    this.ffmpeg.on('progress', ({ progress, time }) => {
      if (onProgress) {
        const percent = Math.round(progress * 100);
        onProgress(`Processing audio: ${percent}%`);
      }
    });

    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.ffmpegLoaded = true;

    if (onProgress) {
      onProgress('FFmpeg loaded successfully');
    }

    return this.ffmpeg;
  }

  /**
   * Load and decode audio from ArrayBuffer
   */
  async loadAudio(arrayBuffer, onProgress = null) {
    const audioContext = this.initAudioContext();

    if (onProgress) {
      onProgress('Decoding audio...');
    }

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

      if (onProgress) {
        const duration = Math.round(audioBuffer.duration);
        onProgress(`Audio loaded: ${duration}s, ${audioBuffer.numberOfChannels} channels`);
      }

      return audioBuffer;

    } catch (error) {
      console.error('Failed to decode audio directly, trying FFmpeg conversion...', error);

      // Try converting with FFmpeg if direct decode fails
      return await this.convertAndLoadAudio(arrayBuffer, onProgress);
    }
  }

  /**
   * Convert audio format using FFmpeg and then load
   */
  async convertAndLoadAudio(arrayBuffer, onProgress = null) {
    await this.initFFmpeg(onProgress);

    if (onProgress) {
      onProgress('Converting audio format...');
    }

    // Write input file
    const inputName = 'input';
    const outputName = 'output.wav';

    await this.ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));

    // Convert to WAV for Web Audio API compatibility
    await this.ffmpeg.exec([
      '-i', inputName,
      '-acodec', 'pcm_s16le',
      '-ar', '44100',
      '-ac', '1',  // Mono
      outputName
    ]);

    // Read output
    const data = await this.ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'audio/wav' });
    const convertedArrayBuffer = await blob.arrayBuffer();

    // Clean up FFmpeg files
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Decode the converted audio
    const audioContext = this.initAudioContext();
    const audioBuffer = await audioContext.decodeAudioData(convertedArrayBuffer);

    if (onProgress) {
      onProgress('Audio converted and loaded successfully');
    }

    return audioBuffer;
  }

  /**
   * Trim audio to specified time range
   */
  trimAudio(audioBuffer, startTime = 0, endTime = null) {
    const audioContext = this.initAudioContext();

    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;

    const startSample = Math.floor(startTime * sampleRate);
    const endSample = endTime ? Math.floor(endTime * sampleRate) : audioBuffer.length;

    const trimmedLength = endSample - startSample;

    // Create new buffer with trimmed length
    const trimmedBuffer = audioContext.createBuffer(
      numberOfChannels,
      trimmedLength,
      sampleRate
    );

    // Copy trimmed audio data
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);

      for (let i = 0; i < trimmedLength; i++) {
        trimmedData[i] = sourceData[startSample + i];
      }
    }

    return trimmedBuffer;
  }

  /**
   * Convert AudioBuffer to mono if it's stereo
   */
  convertToMono(audioBuffer) {
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer;
    }

    const audioContext = this.initAudioContext();
    const monoBuffer = audioContext.createBuffer(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const monoData = monoBuffer.getChannelData(0);

    // Average all channels
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / audioBuffer.numberOfChannels;
    }

    return monoBuffer;
  }

  /**
   * Resample audio to target sample rate
   */
  async resampleAudio(audioBuffer, targetSampleRate) {
    if (audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer;
    }

    const audioContext = this.initAudioContext();

    // Create offline context with target sample rate
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    // Render
    const resampledBuffer = await offlineContext.startRendering();

    return resampledBuffer;
  }

  /**
   * Get audio samples as Float32Array (for Magenta.js)
   */
  getAudioSamples(audioBuffer) {
    // Magenta.js expects mono audio
    const monoBuffer = this.convertToMono(audioBuffer);
    return monoBuffer.getChannelData(0);
  }
}
