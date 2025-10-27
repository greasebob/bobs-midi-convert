# YouTube to MIDI Converter

Convert audio files and YouTube videos to MIDI using client-side piano transcription powered by Magenta.js and TensorFlow.js.

## Features

- **Piano Transcription**: High-quality audio-to-MIDI conversion using Google's Magenta.js OnsetsAndFrames model
- **Client-Side Processing**: All heavy computation runs in your browser using your device's CPU/GPU - no server required
- **YouTube Downloads**: Download and convert YouTube videos via Vercel serverless API
- **Local Files**: Upload and convert local audio files (MP3, WAV, FLAC, M4A, OGG, etc.)
- **Advanced Settings**:
  - Audio trimming (start/end time)
  - Note duration filtering
  - Custom output filenames
  - Batch processing
  - ZIP packaging for multiple files
- **Privacy**: Your audio files never leave your computer (except YouTube URLs which are processed via API)

## Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

4. **Upload audio or paste YouTube URL and convert**

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deploying to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (approximately 2-3 minutes)
   - Your app is live

4. **Future Deployments:**
   - Every push to `main` branch auto-deploys
   - Pull requests get preview deployments

### Environment Variables
No environment variables required. Everything runs client-side.

## Project Structure

```
youtube-to-midi/
├── api/
│   └── download-youtube.js     # Vercel serverless function for YouTube downloads
├── src/
│   ├── modules/
│   │   ├── audioProcessor.js   # Audio loading, conversion, trimming
│   │   ├── pianoTranscription.js  # Magenta.js piano transcription
│   │   ├── midiGenerator.js    # MIDI file generation
│   │   ├── youtubeDownloader.js   # YouTube API client
│   │   ├── fileHandler.js      # File upload handling
│   │   └── uiController.js     # UI state management
│   ├── main.js                 # Main application orchestration
│   └── style.css               # Styles
├── index.html                  # Main HTML UI
├── package.json                # Dependencies
├── vercel.json                 # Vercel configuration
└── README.md                   # This file
```

## Technologies Used

### Frontend (Client-Side)
- **Magenta.js**: Piano transcription model (OnsetsAndFrames)
- **TensorFlow.js**: Machine learning in the browser with WebGL acceleration
- **FFmpeg.wasm**: Audio format conversion in WebAssembly
- **Tone.js/MIDI**: MIDI file generation
- **Web Audio API**: Audio processing and resampling
- **Vite**: Build tool and dev server

### Backend (Serverless)
- **Vercel Serverless Functions**: YouTube audio download API
- **ytdl-core**: YouTube download library

## How It Works

1. **Audio Input**: User provides YouTube URL or uploads local audio file
2. **Download/Load**: YouTube audio downloaded via API, or local file loaded
3. **Processing**:
   - Audio decoded using Web Audio API
   - Converted to 16kHz mono using FFmpeg.wasm
   - Optional trimming applied
4. **Transcription**: Magenta.js OnsetsAndFrames model transcribes audio to notes
5. **MIDI Generation**: Notes converted to MIDI file using @tonejs/midi
6. **Download**: MIDI file (and optional audio) downloaded to user's device

## Performance Notes

- **First Load**: Model downloads ~50MB on first use (cached after)
- **Processing Speed**: Depends on your device's CPU/GPU
  - Desktop: Usually faster than real-time
  - Laptop: About real-time
  - Mobile: May be slower than real-time
- **File Size Limits**: Browser memory limits may restrict very long files (more than 10 minutes on lower-end devices)

## Troubleshooting

### Model Loading Issues
- **Symptom**: "Failed to load model"
- **Solution**: Check internet connection, try refreshing the page

### YouTube Download Fails
- **Symptom**: "Failed to download from YouTube"
- **Solution**:
  - Check if URL is valid
  - Some videos may be restricted by YouTube
  - Try downloading the audio manually and uploading as local file

### Audio Processing Errors
- **Symptom**: "Failed to decode audio"
- **Solution**:
  - Try converting audio to MP3 or WAV first
  - Ensure file is not corrupted
  - Check file size isn't too large

### Out of Memory
- **Symptom**: Page crashes or becomes unresponsive
- **Solution**:
  - Process shorter audio clips
  - Use audio trimming feature
  - Close other browser tabs

## Known Limitations

- **No Transkun model**: Only Piano Transcription model is available (browser-compatible)
- **No cookie authentication**: YouTube downloads work without auth (may fail for age-restricted videos)
- **YouTube playlist support**: Currently processes individual videos only
- **Audio quality**: Best results with solo piano recordings

## Contributing

This project was migrated from Google Colab Python to a client-side web application. Contributions welcome.

## License

This project uses:
- Magenta.js (Apache 2.0)
- TensorFlow.js (Apache 2.0)
- FFmpeg.wasm (LGPL 2.1)

## Acknowledgments

- Google Magenta team for the OnsetsAndFrames model
- TensorFlow.js team for making ML in the browser possible
- FFmpeg team for the amazing audio processing library
- Original Google Colab notebook author

---

Ready to convert some audio to MIDI? Start the dev server and give it a try.
