import os
from dotenv import load_dotenv

try:
    import groq
except ImportError:
    print('Groq library not installed')
    exit(1)

load_dotenv('.env')
api_key = os.environ.get('GROQ_API_KEY')
if not api_key:
    print('GROQ_API_KEY not found in .env')
    exit(1)

print('API Key loaded successfully from .env. Connecting to Groq...')
try:
    client = groq.Groq(api_key=api_key)
    resp = client.chat.completions.create(
        model='llama-3.1-8b-instant',
        messages=[{'role': 'user', 'content': 'Say the word "active"'}],
        max_tokens=10
    )
    print(f'Response: {resp.choices[0].message.content}')
    print('API IS ACTIVE AND WORKING!')
except Exception as e:
    print(f'Error connecting to Groq API: {e}')
