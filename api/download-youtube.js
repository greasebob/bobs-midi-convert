/**
 * Vercel Serverless Function: YouTube Audio Download
 * Downloads audio from YouTube URL and returns it to the client
 */

import ytdl from '@ybd-project/ytdl-core';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { url } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info first
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;

    // Set response headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(title)}.mp3"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    // Stream audio directly to response
    const audioStream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    // Pipe the audio stream to the response
    audioStream.pipe(res);

    // Handle stream errors
    audioStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download audio from YouTube' });
      }
    });

  } catch (error) {
    console.error('YouTube download error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download from YouTube',
        details: error.message
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
