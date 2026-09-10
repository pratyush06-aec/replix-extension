import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from dotenv import load_dotenv
from groq import Groq
from soniox import SonioxClient
import tempfile

# Load environment variables
load_dotenv()

app = FastAPI(title="Replix Captions POC API")

# Setup CORS to allow Chrome extension to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client for LLM Romanization
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("Warning: GROQ_API_KEY not found in environment variables.")
groq_client = Groq(api_key=groq_api_key)

# Initialize Soniox client for STT
soniox_api_key = os.getenv("SONIOX_API_KEY")
if not soniox_api_key:
    print("Warning: SONIOX_API_KEY not found in environment variables.")
soniox_client = SonioxClient(api_key=soniox_api_key) if soniox_api_key else SonioxClient()

@app.post("/transcribe")
async def transcribe_media(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    try:
        # Read the uploaded file content into memory
        content = await file.read()
        print(f"Received file: {file.filename}, size: {len(content)} bytes")
        
        # Pass bytes directly to Soniox (avoids Windows temp file locking issues)
        print("Starting Soniox transcription...")
        transcript = soniox_client.stt.transcribe_and_wait_with_tokens(
            file=content,
            filename=file.filename,
            delete_after=True
        )
        print("Soniox transcription successful.")
        
        # Extract word-level timestamps from Soniox tokens
        formatted_words = []
        
        # The transcript object has a .tokens attribute with Token objects
        tokens = []
        if hasattr(transcript, 'tokens') and transcript.tokens:
            tokens = transcript.tokens
        elif hasattr(transcript, 'words') and transcript.words:
            tokens = transcript.words
        
        for token in tokens:
            word_text = getattr(token, 'text', str(token)).strip()
            if not word_text:
                continue
            formatted_words.append({
                "word": word_text,
                "start": getattr(token, 'start_ms', 0) / 1000.0,
                "end": getattr(token, 'end_ms', 0) / 1000.0
            })
        
        # Form the full original text
        original_text = " ".join([w["word"] for w in formatted_words])
        
        # If no text from tokens, try the transcript.text attribute
        if not original_text.strip() and hasattr(transcript, 'text') and transcript.text:
            original_text = transcript.text.strip()
        
        # Use Groq LLM to Romanize (Transliterate) the text
        english_translation = ""
        if original_text.strip():
            try:
                print("Generating Romanization via Groq LLM...")
                chat_completion = groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a professional transliterator. Convert the following text into English script (Romanization) based on its pronunciation, preserving the original language. Do not translate the meaning. Output ONLY the romanized text. For example, if it's Hindi 'कैसे हो', output 'kaise ho'. If it's already in English script, just return it."
                        },
                        {
                            "role": "user",
                            "content": original_text
                        }
                    ],
                    model="openai/gpt-oss-120b",
                    temperature=0.3
                )
                english_translation = chat_completion.choices[0].message.content.strip()
            except Exception as llm_error:
                print(f"Romanization failed: {llm_error}")
                english_translation = "Romanization unavailable."
        
        return {
            "words": formatted_words,
            "original_text": original_text,
            "english_translation": english_translation
        }

    except Exception as e:
        print(f"Error processing media: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
