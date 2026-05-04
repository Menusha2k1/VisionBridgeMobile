import asyncio
import edge_tts
import sys
import os
import json
import time

async def generate_audio(text, output_path):
    try:
        communicate = edge_tts.Communicate(text, "en-US-AndrewNeural")
        await communicate.save(output_path)
        return True
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No text provided"}))
        return

    text = sys.argv[1]
    
    # Split text into chunks by double newlines
    raw_chunks = [c.strip() for c in text.split("\n\n") if c.strip()]
    
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    result_chunks = []
    timestamp = int(time.time())

    for i, chunk_text in enumerate(raw_chunks):
        audio_filename = f"audio_{timestamp}_{i}.mp3"
        audio_path = os.path.join(uploads_dir, audio_filename)
        
        success = await generate_audio(chunk_text, audio_path)
        
        result_chunks.append({
            "id": i,
            "text": chunk_text,
            "audio": audio_filename if success else None
        })

    print(json.dumps({
        "status": "success",
        "chunks": result_chunks
    }))

if __name__ == "__main__":
    asyncio.run(main())
