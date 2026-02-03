from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

APP = Flask(__name__)

# Autoriser le site public khmvoice
CORS(APP, resources={
    r"/api/*": {
        "origins": [
            "https://www.khmvoice.org",
            "https://khmvoice.org"
        ]
    }
})

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

@APP.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    lang = (data.get("lang") or "fr").lower()
    prompt = (data.get("prompt") or "").strip()
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "Question vide"}), 400

    # Instruction langue
    if lang == "kh":
        system_msg = "Réponds exclusivement en khmer."
    elif lang == "en":
        system_msg = "Answer exclusively in English."
    else:
        system_msg = "Réponds exclusivement en français."

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": f"{prompt}\n\n{question}"}
    ]

    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": OPENAI_MODEL,
                "messages": messages,
                "temperature": 0.4
            },
            timeout=60
        )
    except Exception as e:
        return jsonify({"error": "OpenAI request failed", "detail": str(e)}), 500

    if r.status_code != 200:
        return jsonify({
            "error": "OpenAI error",
            "status": r.status_code,
            "detail": r.text
        }), 500

    answer = r.json()["choices"][0]["message"]["content"]
    return jsonify({"answer": answer})
