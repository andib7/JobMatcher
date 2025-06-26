from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import os
import openai
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env automatically

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# CORS settings for local React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === In-memory storage for resume ===
resume_storage = {"latest_resume": ""}

# === Data Models ===
class ResumeText(BaseModel):
    text: str

class JobDescription(BaseModel):
    job_description: str

class GenerateRequest(BaseModel):
    resume: str
    job_description: str

# === Endpoints ===

@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")
    text = ""
    for page in doc:
        page_text = page.get_text("text")
        text += page_text + "\n\n"

    # Store resume for future reference
    resume_storage["latest_resume"] = text
    return {"text": text}

@app.post("/job-description/")
async def job_description(data: JobDescription):
    try:
        resume_text = resume_storage.get("latest_resume", "")
        if not resume_text:
            return {"error": "No resume uploaded yet."}

        prompt = (
            "You are helping someone apply to jobs. Based on the resume and the job description below, "
            "generate 3 follow-up questions you would ask to improve their job application.\n\n"
            f"Resume:\n{resume_text[:3000]}\n\n"
            f"Job Description:\n{data.job_description[:3000]}\n\n"
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

@app.post("/generate/")
async def generate_tailored(request: GenerateRequest):
    try:
        prompt = (
            "You are an expert career advisor. Given the following resume and job description, "
            "generate a tailored resume summary or cover letter paragraph that highlights "
            "the applicant's fit for the job.\n\n"
            f"Resume:\n{request.resume[:3000]}\n\n"
            f"Job Description:\n{request.job_description[:3000]}\n\n"
            "Tailored Resume / Cover Letter:"
        )

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

        result = response.choices[0].message.content.strip()
        return {"result": result}

    except Exception as e:
        return {"error": str(e)}
