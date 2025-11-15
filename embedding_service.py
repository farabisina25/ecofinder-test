from fastapi import FastAPI
from sentence_transformers import SentenceTransformer, util
import torch

app = FastAPI(title="EchoFinder Embedding Service")

# Load model once
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✓ Model loaded successfully.")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    model = None


@app.post("/embed")
async def embed_text(request: dict):
    """Get embedding for a text"""
    if not model:
        return {"error": "Model not loaded"}
    
    text = request.get("text", "")
    if not text:
        return {"error": "text is required"}
    
    embedding = model.encode(text).tolist()
    return {"text": text, "embedding": embedding}


@app.post("/compare")
async def compare_issues(request: dict):
    """Compare new issue with historical issues"""
    if not model:
        return {"error": "Model not loaded"}
    
    new_text = request.get("new_text", "")
    old_texts = request.get("old_texts", [])
    
    if not new_text or not old_texts:
        return {"error": "new_text and old_texts are required"}
    
    try:
        # Encode all texts
        new_embedding = model.encode(new_text, convert_to_tensor=True)
        old_embeddings = model.encode(old_texts, convert_to_tensor=True)
        
        # Calculate similarities
        scores = util.cos_sim(new_embedding, old_embeddings)
        
        # Find best match
        best_idx = torch.argmax(scores[0]).item()
        best_score = float(scores[0][best_idx])
        
        # Return all scores
        all_scores = [float(s) for s in scores[0]]
        
        return {
            "new_text": new_text,
            "scores": all_scores,
            "best_match_index": best_idx,
            "best_score": best_score,
            "threshold_met": best_score > 0.70
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)