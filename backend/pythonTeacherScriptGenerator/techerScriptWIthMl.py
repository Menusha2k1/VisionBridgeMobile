import pdfplumber
import os
import sys
import json
import re
import asyncio
import edge_tts
import time
from docx import Document

from transformers import T5Tokenizer, T5ForConditionalGeneration

# Load model (silent)
tokenizer = T5Tokenizer.from_pretrained("t5-small")
model = T5ForConditionalGeneration.from_pretrained("t5-small")


# =========================
# CLEAN TEXT
# =========================
def clean_text(text):
    if not text:
        return ""

    text = re.sub(r'\(cid:\d+\)', '', text)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


# =========================
# REMOVE DUPLICATES
# =========================
def remove_duplicates(lines):
    seen = set()
    result = []

    for line in lines:
        if line not in seen:
            result.append(line)
            seen.add(line)

    return result


# =========================
# DETECT HEADINGS
# =========================
def is_heading(line):
    return bool(re.match(r'^\d+(\.\d+)+', line))


def is_problem(line):
    return line.lower().startswith("problem")


# =========================
# IMPROVE TEXT
# =========================
def improve_text(text):
    try:
        if len(text.split()) < 20:
            return text

        input_ids = tokenizer(
            "simplify: " + text,
            return_tensors="pt"
        ).input_ids

        output = model.generate(input_ids, max_length=100)

        return tokenizer.decode(output[0], skip_special_tokens=True)

    except:
        return text


# =========================
# READ PDF
# =========================
def read_pdf(path):
    lines = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            for line in text.split("\n"):
                line = clean_text(line)
                if len(line) > 10:
                    lines.append(line)

    return remove_duplicates(lines)


# =========================
# READ DOCX
# =========================
def read_docx(path):
    doc = Document(path)
    lines = []

    for para in doc.paragraphs:
        line = clean_text(para.text)
        if len(line) > 10:
            lines.append(line)

    return remove_duplicates(lines)


# =========================
# SPLIT INTO TOPICS
# =========================
def split_topics(lines):
    topics = []
    current = []

    for line in lines:

        if is_heading(line) or is_problem(line):

            if current:
                topics.append(" ".join(current))
                current = []

            topics.append(line)

        else:
            current.append(line)

    if current:
        topics.append(" ".join(current))

    return topics


# =========================
# AUDIO GENERATION
# =========================
async def generate_audio(text, output_path):
    """Generates audio from text using edge-tts."""
    try:
        communicate = edge_tts.Communicate(text, "en-US-AndrewNeural")
        await communicate.save(output_path)
        return True
    except Exception as e:
        # Fallback or silent error for now
        return False


# =========================
# MAIN ASYNC PROCESS
# =========================
async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No file path provided"}))
        return

    file_path = sys.argv[1]
    
    # Check file exists
    if not os.path.exists(file_path):
        print(json.dumps({"status": "error", "message": "File not found"}))
        return

    if file_path.endswith(".pdf"):
        lines = read_pdf(file_path)
    elif file_path.endswith(".docx"):
        lines = read_docx(file_path)
    else:
        print(json.dumps({"status": "error", "message": "Unsupported file format"}))
        return

    topics = split_topics(lines)
    
    script_chunks = []
    full_script_text = ""
    
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    for i, topic in enumerate(topics):
        if is_heading(topic) or is_problem(topic):
            improved_text_content = topic.upper()
        else:
            improved_text_content = improve_text(topic)
        
        # Generate unique filename for audio
        audio_filename = f"audio_{int(time.time())}_{i}.mp3"
        audio_path = os.path.join(uploads_dir, audio_filename)
        
        # Generate audio
        success = await generate_audio(improved_text_content, audio_path)
        
        script_chunks.append({
            "id": i,
            "text": improved_text_content,
            "audio": audio_filename if success else None
        })
        
        full_script_text += improved_text_content + "\n\n"

    result = {
        "status": "success",
        "scriptText": full_script_text.strip(),
        "chunks": script_chunks
    }

    # IMPORTANT: ONLY JSON OUTPUT
    print(json.dumps(result))


if __name__ == "__main__":
    asyncio.run(main())