/**
 * Vercel Serverless Function: YouTube Audio Download
 * Downloads audio from YouTube URL and returns it to the client
 */

import ytdl from '@ybd-project/ytdl-core';

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

  // Change working directory to /tmp (writable directory on Vercel)
  // This allows ytdl-core to write debug files
  const originalCwd = process.cwd();
  try {
    process.chdir('/tmp');
    console.log('Changed working directory to /tmp');
  } catch (err) {
    console.error('Failed to change to /tmp:', err);
  }

  try {
    const { url } = req.body;

    console.log('Received download request for:', url);

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Simple YouTube URL validation (validateURL doesn't exist in YBD fork)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/;
    if (!youtubeRegex.test(url)) {
      console.log('Invalid YouTube URL format:', url);
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }

    // Get video info first
    console.log('Fetching video info...');
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    console.log('Video title:', title);

    // Download audio data (classic ytdl-core approach)
    console.log('Starting audio download...');

    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    console.log('Converting stream to buffer...');
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    console.log('Audio download complete, sending to client...');
    const buffer = Buffer.concat(chunks);

    // Send response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(title)}.mp3"`);
    res.setHeader('Content-Length', buffer.length);

    res.status(200).send(buffer);

  } catch (error) {
    console.error('=== YouTube Download Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download from YouTube',
        details: error.message,
        type: error.name,
        hint: 'Check Vercel function logs for detailed error information'
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
