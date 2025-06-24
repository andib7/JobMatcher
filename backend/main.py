from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import os
import openai
from dotenv import load_dotenv  # <-- new import

load_dotenv()  # <-- load variables from .env automatically

# Set your OpenAI API key as an environment variable for security
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Allow CORS from your React app origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeText(BaseModel):
    text: str

@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")
    text = ""
    for page in doc:
        page_text = page.get_text("text")
        text += page_text + "\n\n"
    return {"text": text}

@app.post("/questions/")
async def get_questions(data: ResumeText):
    try:
        prompt = (
            "You are helping someone apply to jobs. Based on the resume text below, "
            "generate 3 follow-up questions you would ask to improve their job application.\n\n"
            f"Resume:\n{data.text[:3000]}\n\n"
            "Questions:"
        )

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

        answer = response.choices[0].message.content.strip()
        questions = [q.strip("-• ") for q in answer.split("\n") if q.strip()]
        return {"questions": questions}

    except Exception as e:
        return {"error": str(e)}
