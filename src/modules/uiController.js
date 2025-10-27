/**
 * UI Controller Module
 * Manages all UI updates, progress indicators, and user interactions
 */

export class UIController {
  constructor() {
    this.elements = {};
    this.isProcessing = false;
    this.settingsExpanded = true;
  }

  /**
   * Initialize UI elements
   */
  init() {
    this.elements = {
      // Input elements
      youtubeUrls: document.getElementById('youtubeUrls'),
      customTitle: document.getElementById('customTitle'),
      modelChoice: document.getElementById('modelChoice'),
      chunkDur: document.getElementById('chunkDur'),
      maxNotes: document.getElementById('maxNotes'),
      enableMaxNotes: document.getElementById('enableMaxNotes'),
      startTime: document.getElementById('startTime'),
      endTime: document.getElementById('endTime'),
      zipOutput: document.getElementById('zipOutput'),
      zipFilename: document.getElementById('zipFilename'),
      keepMp3: document.getElementById('keepMp3'),
      includeMp3: document.getElementById('includeMp3'),

      // File upload
      uploadZone: document.getElementById('uploadZone'),
      fileInput: document.getElementById('fileInput'),
      fileInfo: document.getElementById('fileInfo'),

      // Buttons
      convertBtn: document.getElementById('convertBtn'),
      cancelBtn: document.getElementById('cancelBtn'),
      downloadBtn: document.getElementById('downloadBtn'),

      // Progress
      progressSection: document.getElementById('progressSection'),
      progressBar: document.getElementById('progressBar'),
      progressText: document.getElementById('progressText'),
      progressCount: document.getElementById('progressCount'),

      // Results
      resultsSection: document.getElementById('resultsSection'),
      processingLog: document.getElementById('processingLog'),

      // Settings
      settingsContent: document.getElementById('settingsContent'),
      toggleIcon: document.getElementById('toggleIcon'),
      zipFilenameInput: document.getElementById('zipFilenameInput'),
      mp3IncludeOption: document.getElementById('mp3IncludeOption'),

      // File naming
      fileNamingSection: document.getElementById('fileNamingSection'),
      fileNamingList: document.getElementById('fileNamingList'),
    };

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Enable/disable max notes input
    this.elements.enableMaxNotes.addEventListener('change', () => {
      this.elements.maxNotes.disabled = !this.elements.enableMaxNotes.checked;
    });

    // Show/hide ZIP filename input
    this.elements.zipOutput.addEventListener('change', () => {
      if (this.elements.zipOutput.checked) {
        this.elements.zipFilenameInput.classList.add('visible');
      } else {
        this.elements.zipFilenameInput.classList.remove('visible');
      }
    });

    // Show/hide MP3 include option
    this.elements.keepMp3.addEventListener('change', () => {
      if (this.elements.keepMp3.checked) {
        this.elements.mp3IncludeOption.classList.add('visible');
      } else {
        this.elements.mp3IncludeOption.classList.remove('visible');
        this.elements.includeMp3.checked = false;
      }
    });

    // Auto-check keepMp3 when includeMp3 is checked
    this.elements.includeMp3.addEventListener('change', () => {
      if (this.elements.includeMp3.checked) {
        this.elements.keepMp3.checked = true;
        this.elements.keepMp3.disabled = true;
      } else {
        this.elements.keepMp3.disabled = false;
      }
    });

    // YouTube URLs input - enable convert button
    this.elements.youtubeUrls.addEventListener('input', () => {
      this.updateConvertButton();
    });
  }

  /**
   * Update convert button state
   */
  updateConvertButton() {
    const hasYoutubeUrls = this.elements.youtubeUrls.value.trim().length > 0;
    const hasFiles = this.elements.fileInput.files.length > 0;

    this.elements.convertBtn.disabled = !(hasYoutubeUrls || hasFiles) || this.isProcessing;
  }

  /**
   * Show file info
   */
  showFileInfo(files) {
    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      this.elements.fileInfo.innerHTML = `<strong>✓ Selected:</strong> ${fileNames}`;
      this.elements.fileInfo.style.display = 'block';
    } else {
      this.elements.fileInfo.style.display = 'none';
    }

    this.updateConvertButton();
  }

  /**
   * Add log entry
   */
  addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    let color = '#68d391'; // green

    if (type === 'error') color = '#fc8181'; // red
    if (type === 'warning') color = '#fbbf24'; // yellow
    if (type === 'info') color = '#68d391'; // green

    this.elements.processingLog.innerHTML +=
      `<span style="color: ${color};">[${timestamp}] ${message}</span><br>`;
    this.elements.processingLog.scrollTop = this.elements.processingLog.scrollHeight;
  }

  /**
   * Clear log
   */
  clearLog() {
    this.elements.processingLog.innerHTML = '';
  }

  /**
   * Update progress bar
   */
  updateProgress(current, total) {
    this.elements.progressSection.style.display = 'block';

    const percentage = total > 0 ? (current / total) * 100 : 0;
    this.elements.progressBar.style.width = `${percentage}%`;
    this.elements.progressCount.textContent = `${current} / ${total}`;
    this.elements.progressText.textContent = current < total ? 'Processing files...' : 'Complete!';
  }

  /**
   * Hide progress bar
   */
  hideProgress() {
    this.elements.progressSection.style.display = 'none';
  }

  /**
   * Start conversion (UI state)
   */
  startConversion() {
    this.isProcessing = true;
    this.elements.convertBtn.disabled = true;
    this.elements.cancelBtn.disabled = false;
    this.elements.resultsSection.style.display = 'block';
    this.elements.downloadBtn.style.display = 'none';
    this.clearLog();
    this.hideProgress();
  }

  /**
   * End conversion (UI state)
   */
  endConversion() {
    this.isProcessing = false;
    this.elements.convertBtn.disabled = false;
    this.elements.cancelBtn.disabled = true;
    this.updateConvertButton();
  }

  /**
   * Show download button
   */
  showDownloadButton() {
    this.elements.downloadBtn.style.display = 'block';
  }

  /**
   * Get settings from UI
   */
  getSettings() {
    return {
      youtubeUrls: this.elements.youtubeUrls.value,
      customTitle: this.elements.customTitle.value,
      modelChoice: this.elements.modelChoice.value,
      chunkDur: parseFloat(this.elements.chunkDur.value),
      maxNotes: parseFloat(this.elements.maxNotes.value),
      enableMaxNotes: this.elements.enableMaxNotes.checked,
      startTime: parseFloat(this.elements.startTime.value),
      endTime: parseFloat(this.elements.endTime.value),
      zipOutput: this.elements.zipOutput.checked,
      zipFilename: this.elements.zipFilename.value,
      keepMp3: this.elements.keepMp3.checked,
      includeMp3: this.elements.includeMp3.checked,
    };
  }

  /**
   * Toggle settings panel
   */
  toggleSettings() {
    this.settingsExpanded = !this.settingsExpanded;

    if (this.settingsExpanded) {
      this.elements.settingsContent.style.display = 'block';
      this.elements.toggleIcon.style.transform = 'rotate(0deg)';
    } else {
      this.elements.settingsContent.style.display = 'none';
      this.elements.toggleIcon.style.transform = 'rotate(-90deg)';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.addLog(`❌ ${message}`, 'error');
    alert(`Error: ${message}`);
  }

  /**
   * Update file naming section for multiple files
   */
  updateFileNamingSection(fileCount) {
    if (fileCount > 1) {
      this.elements.fileNamingSection.style.display = 'block';
    } else {
      this.elements.fileNamingSection.style.display = 'none';
    }
  }

  /**
   * Get custom file names from UI
   */
  getCustomFileNames() {
    const inputs = this.elements.fileNamingList.querySelectorAll('.file-custom-name');
    return Array.from(inputs).map(input => input.value.trim());
  }
}
