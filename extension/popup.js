document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('mediaFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileType = document.getElementById('fileType');
    const fileSize = document.getElementById('fileSize');
    const generateBtn = document.getElementById('generateBtn');
    
    const statusArea = document.getElementById('statusArea');
    const statusText = document.getElementById('statusText');
    const paragraphArea = document.getElementById('paragraphArea');
    const paragraphOutput = document.getElementById('paragraphOutput');
    const translationArea = document.getElementById('translationArea');
    const translationOutput = document.getElementById('translationOutput');
    const outputArea = document.getElementById('outputArea');
    const jsonOutput = document.getElementById('jsonOutput');

    let selectedFile = null;

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file) {
            selectedFile = file;
            
            // Display metadata
            fileName.textContent = file.name;
            fileType.textContent = file.type || 'Unknown';
            fileSize.textContent = formatBytes(file.size);
            
            fileInfo.classList.remove('hidden');
            generateBtn.disabled = false;
            
            // Reset output/status if there was a previous run
            paragraphArea.classList.add('hidden');
            translationArea.classList.add('hidden');
            outputArea.classList.add('hidden');
            statusArea.classList.add('hidden');
            paragraphOutput.textContent = '';
            translationOutput.textContent = '';
            jsonOutput.textContent = '';
        } else {
            selectedFile = null;
            fileInfo.classList.add('hidden');
            generateBtn.disabled = true;
        }
    });

    // Handle generation
    generateBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            updateStatus('Please select a media file.', 'error');
            return;
        }

        // Disable button during processing
        generateBtn.disabled = true;
        paragraphArea.classList.add('hidden');
        translationArea.classList.add('hidden');
        outputArea.classList.add('hidden');
        
        updateStatus('Status: Uploading, transcribing, and translating...', '');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('http://127.0.0.1:8000/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            // Check if result has the new structure or if words array is empty
            if (!result || !result.words || result.words.length === 0) {
                updateStatus('Status: No word-level timestamps were returned.', 'error');
            } else {
                updateStatus('Status: Complete', 'success');
                
                // Show original paragraph
                paragraphOutput.textContent = result.original_text || result.words.map(item => item.word).join(' ');
                paragraphArea.classList.remove('hidden');
                
                // Show English translation
                if (result.english_translation) {
                    translationOutput.textContent = result.english_translation;
                    translationArea.classList.remove('hidden');
                }
                
                // Show JSON
                outputArea.classList.remove('hidden');
                jsonOutput.textContent = JSON.stringify(result.words, null, 2);
            }

        } catch (error) {
            console.error('Transcription error:', error);
            updateStatus(`Status: Transcription failed. ${error.message}`, 'error');
        } finally {
            generateBtn.disabled = false;
        }
    });

    function updateStatus(message, type) {
        statusArea.classList.remove('hidden');
        statusText.textContent = message;
        statusText.className = type; // 'error', 'success', or empty
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
});
