/**
 * YouTube Downloader Module
 * Handles downloading audio from YouTube URLs via Vercel API
 */

export class YouTubeDownloader {
  constructor(apiEndpoint = '/api/download-youtube') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Download audio from YouTube URL
   */
  async downloadAudio(url, onProgress = null) {
    try {
      if (onProgress) {
        onProgress(`Downloading from YouTube: ${url.substring(0, 50)}...`);
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the audio data as ArrayBuffer
      const audioBuffer = await response.arrayBuffer();

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download.mp3';

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      if (onProgress) {
        onProgress(`Downloaded: ${filename}`);
      }

      return {
        buffer: audioBuffer,
        filename: filename,
        url: url
      };

    } catch (error) {
      console.error('YouTube download error:', error);
      throw new Error(`Failed to download from YouTube: ${error.message}`);
    }
  }

  /**
   * Download multiple YouTube URLs
   */
  async downloadMultiple(urls, onProgress = null, onError = null) {
    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        if (onProgress) {
          onProgress(`Downloading ${i + 1}/${urls.length}: ${url.substring(0, 50)}...`);
        }

        const result = await this.downloadAudio(url, onProgress);
        results.push(result);

      } catch (error) {
        console.error(`Failed to download ${url}:`, error);

        if (onError) {
          onError(url, error);
        }

        // Continue with next URL even if this one failed
        if (onProgress) {
          onProgress(`Failed to download: ${url}`);
        }
      }
    }

    return results;
  }

  /**
   * Validate YouTube URL
   */
  isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/;
    return youtubeRegex.test(url);
  }

  /**
   * Parse YouTube URLs from textarea (one per line)
   */
  parseUrls(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && this.isValidYouTubeUrl(line));
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
