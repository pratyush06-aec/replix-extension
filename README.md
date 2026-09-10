# Replix Caption POC

Replix Caption POC is a Chrome Extension and FastAPI backend that allows users to select audio/video files and instantly generate timestamped captions alongside a Romanized (English-script transliterated) version of the native language audio.

The system relies on **Soniox** for high-quality Speech-to-Text (STT) and **Groq (LLMs)** for rapid transliteration/romanization of the text.

## Project Structure

```text
replix-extension/
├── extension/          # Chrome Extension (Frontend)
│   ├── manifest.json   # Extension metadata and permissions
│   ├── popup.html      # UI structure
│   ├── popup.css       # Styling
│   └── popup.js        # Logic (handles file upload & API requests)
├── server/             # FastAPI Backend
│   ├── main.py         # Main server logic and endpoints
│   ├── requirements.txt# Python dependencies
│   └── .env.example    # Example environment variables
└── .gitignore          # Git ignore rules
```

## Prerequisites
- **Python 3.8+**
- **Google Chrome** or any Chromium-based browser
- API Keys for **Soniox** and **Groq**

---

## 🛠 Backend Setup

The backend handles the heavy lifting of parsing media, communicating with the Soniox STT API, and running the Groq LLM for Romanization.

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create a Python Virtual Environment:**
   ```bash
   # Windows
   python -m venv venv
   
   # macOS / Linux
   python3 -m venv venv
   ```

3. **Activate the Virtual Environment:**
   ```bash
   # Windows Command Prompt
   .\venv\Scripts\activate.bat
   
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   
   # macOS / Linux
   source venv/bin/activate
   ```

4. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up Environment Variables:**
   - Copy the `.env.example` file to create your own `.env` file.
   ```bash
   # Windows
   copy .env.example .env
   
   # macOS / Linux
   cp .env.example .env
   ```
   - Open `.env` and fill in your API keys:
     - `GROQ_API_KEY`: Get this from the [Groq Console](https://console.groq.com/keys)
     - `SONIOX_API_KEY`: Get this from the Soniox Dashboard

6. **Run the Server:**
   Start the FastAPI development server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The server will be live at `http://127.0.0.1:8000`. You can view the interactive API documentation at `http://127.0.0.1:8000/docs`.

*(Note: The Groq LLM model in `server/main.py` is currently configured to `gpt-oss-120b`. If Groq's API throws a model-not-found error, you may need to prefix it with `openai/`, depending on their active endpoint aliases.)*

---

## 🧩 Extension Setup

The frontend is a vanilla JavaScript Chrome Extension. It sends selected files to the local FastAPI server.

1. Open your Chromium browser (Chrome, Edge, Brave).
2. Navigate to the Extensions page: `chrome://extensions/`
3. Toggle on **Developer mode** (usually in the top-right corner).
4. Click the **Load unpacked** button.
5. Select the `extension/` folder located inside your cloned `replix-extension` directory.
6. The "Replix Caption POC" extension icon will now appear in your browser toolbar. Click it to open the popup and use the tool!

---

## 🚀 Usage Guide

1. Ensure the backend FastAPI server is running.
2. Click the Replix extension icon in your browser.
3. Click **Choose File** and select an audio or video file (`.mp4`, `.mp3`, `.wav`, `.ogg`).
4. Click **Generate Captions**.
5. Wait for the processing to finish. The popup will display:
   - The Original Caption Text
   - The Romanized (English-script) Translation
   - The JSON raw output containing word-level timestamps.

---

## Contributing & Pushing Updates

If you are a developer picking up this context, you can immediately begin tweaking `server/main.py` for backend logic (like tweaking the LLM prompt or model) or `extension/popup.js` for frontend behavior.

When you're ready to commit your changes:
```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
```
