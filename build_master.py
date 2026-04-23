import json
import os
import re

files = [
    '01_data_pipeline.ipynb',
    '02_bus_simulator.ipynb',
    '03_rl_agent.ipynb',
    '04_llm_reasoning.ipynb',
    '05_economics_analysis.ipynb'
]

# Configure Colab Notebook Metadata to require a T4 GPU
master = {
    'cells': [], 
    'metadata': {
        'accelerator': 'GPU',
        'colab': {
            'gpuType': 'T4',
            'name': 'ECO_SYNC_Master.ipynb'
        },
        'kernelspec': {
            'display_name': 'Python 3',
            'name': 'python3'
        }
    }, 
    'nbformat': 4, 
    'nbformat_minor': 5
}

# 1. Colab Install Cell
install_cell = {
    'cell_type': 'code',
    'execution_count': None,
    'metadata': {},
    'outputs': [],
    'source': [
        '# Install core dependencies\n',
        '!pip install gymnasium stable-baselines3 osmnx groq python-dotenv kaggle\n'
    ]
}
master['cells'].append(install_cell)

# 2. Secrets & Kaggle Setup Cell
secrets_cell = {
    'cell_type': 'code',
    'execution_count': None,
    'metadata': {},
    'outputs': [],
    'source': [
        '# Load Secrets securely from Google Colab\n',
        'import os\n',
        'try:\n',
        '    from google.colab import userdata\n',
        '    # Groq API Key\n',
        '    os.environ["GROQ_API_KEY"] = userdata.get("GROQ_API_KEY")\n',
        '    print("✅ GROQ_API_KEY loaded successfully.")\n',
        '    \n',
        '    # Kaggle API Keys\n',
        '    os.environ["KAGGLE_USERNAME"] = userdata.get("KAGGLE_USERNAME")\n',
        '    os.environ["KAGGLE_KEY"] = userdata.get("KAGGLE_KEY")\n',
        '    print("✅ Kaggle credentials loaded successfully.")\n',
        '    \n',
        '    # Example: Download a Kaggle dataset (Uncomment and replace with actual dataset ID)\n',
        '    # !kaggle datasets download -d <your-dataset-name> --unzip -p ./data/raw\n',
        'except Exception as e:\n',
        '    print(f"⚠️ Warning: Could not load secrets from Colab. Ensure they are set in the sidebar. Error: {e}")\n'
    ]
}
master['cells'].append(secrets_cell)

for f in files:
    path = os.path.join('notebooks', f)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as nb_f:
            nb = json.load(nb_f)
            for cell in nb.get('cells', []):
                source = ''.join(cell.get('source', []))
                
                # Apply 1 Million Timestep training
                if 'total_timesteps=' in source:
                    source = re.sub(r'total_timesteps=\d+', 'total_timesteps=1000000', source)
                    
                # Fix any local .env loading issues inside reasoning.py logic if it was copied over
                if 'from dotenv import load_dotenv' in source:
                    source = source.replace("load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))", "# Use Colab secrets instead of .env")
                    
                # Upgrade to Full Graph for Colab
                if 'ox.graph_from_bbox' in source:
                    import re
                    source = re.sub(r"graph = ox\.graph_from_bbox\(.*?\)", "graph = ox.graph_from_place('Bengaluru, Karnataka, India', network_type='drive')", source)
                    source = source.replace("We use a lightweight bounding box around a segment of ORR (Agara/HSR Layout) to ensure rapid prototyping.", "Extracting the full Bengaluru city road network for complete simulation coverage.")

                cell['source'] = [source]
                master['cells'].append(cell)

with open('ECO_SYNC_Master.ipynb', 'w', encoding='utf-8') as out:
    json.dump(master, out, indent=1)
print('Master notebook rebuilt with GPU and Secrets requirements')
