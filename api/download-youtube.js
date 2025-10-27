/**
 * Vercel Serverless Function: YouTube Audio Download
 * Downloads audio from YouTube URL and returns it to the client
 */

import { YtdlCore, toPipeableStream } from '@ybd-project/ytdl-core/serverless';

// Initialize ytdl instance for serverless environment
const ytdl = new YtdlCore();

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { url } = req.body;

    console.log('Received download request for:', url);

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info first
    console.log('Fetching video info...');
    const info = await ytdl.getBasicInfo(url);
    const title = info.videoDetails.title;
    console.log('Video title:', title);

    // Collect audio data in buffer for Vercel serverless
    console.log('Starting audio download...');
    const chunks = [];

    // Use serverless-optimized download method
    const stream = await ytdl.download(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    // Convert to pipeable stream for Node.js
    const audioStream = toPipeableStream(stream);

    audioStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    audioStream.on('end', () => {
      console.log('Audio download complete, sending to client...');
      const buffer = Buffer.concat(chunks);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(title)}.mp3"`);
      res.setHeader('Content-Length', buffer.length);

      res.status(200).send(buffer);
    });

    audioStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to download audio from YouTube',
          details: error.message
        });
      }
    });

  } catch (error) {
    console.error('YouTube download error:', error);
    console.error('Error stack:', error.stack);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download from YouTube',
        details: error.message,
        type: error.name
      });
    }
  }
}

/**
 * Sanitize filename to be filesystem-safe
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '_')
    .substring(0, 200);
}
