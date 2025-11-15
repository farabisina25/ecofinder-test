# EchoFinder AI Bot 🤖

An intelligent GitHub bot that automatically detects duplicate issues using Sentence-BERT semantic similarity and posts helpful comments.

## 🌟 Features

✅ **Semantic Similarity Detection** - Uses Sentence-BERT (all-MiniLM-L6-v2) for accurate duplicate detection
💬 **Automatic Comments** - Posts informative comments when potential duplicates are found
🏷️ **Auto-labeling** - Marks issues with "duplicate?" label
⚡ **Real-time Processing** - Instantly responds to new issues via GitHub webhooks
🔧 **Easy Setup** - Simple configuration with Probot and smee.io

## 📋 How It Works

1. **Issue Created** → GitHub sends webhook event
2. **Similarity Check** → Bot fetches all open issues and compares using Sentence-BERT embeddings
3. **Analysis** → Calculates cosine similarity scores
4. **Result** → If similarity > 70%, posts comment with link to potential duplicate
5. **Labeling** → Optionally adds "duplicate?" label

### Example

**New Issue:** "Cannot complete purchase - PayPal button disabled"

**Bot Response:**
```
🔍 Potential Duplicate Found

This issue is very similar to #6: "Payment button is greyed out"

📊 Similarity Score: 87.3%

Please review if this is a duplicate. If confirmed, you can close this issue.
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ 
- **Python** 3.8+
- **npm** or **yarn**
- GitHub account
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/echofinderai-bot.git
cd echofinderai-bot
```

#### 2. Install Node Dependencies

```bash
npm install
```

#### 3. Install Python Dependencies

```bash
pip install sentence-transformers torch fastapi uvicorn
```

---

## ⚙️ Configuration

### Step 1: Create GitHub App

1. Go to: https://github.com/settings/apps/new
2. **App name:** `echofinderai` (or your preferred name)
3. **Homepage URL:** `http://localhost:3000`
4. **Webhook URL:** `https://smee.io/YOUR_SMEE_URL`
5. **Permissions:**
   - Issues: Read & Write
   - Metadata: Read
6. **Subscribe to events:** Issues
7. Click **"Create GitHub App"**

### Step 2: Get Credentials

1. Go to your app settings: https://github.com/apps/YOUR_APP_NAME/settings/basic
2. Copy **App ID**
3. Generate and download **Private Key** (.pem file)
4. Copy **Webhook Secret**

### Step 3: Set Up Smee.io

1. Go to: https://smee.io/new
2. Copy your smee.io URL (e.g., `https://smee.io/abc123xyz`)

### Step 4: Create `.env` File

Create `.env` in the `echofinder/` folder:

```bash
// filepath: echofinder/.env
APP_ID=YOUR_APP_ID_HERE
PRIVATE_KEY_PATH=./private-key.pem
WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
LOG_LEVEL=debug
EMBEDDING_SERVER=http://localhost:8001
WEBHOOK_PROXY_URL=https://smee.io/YOUR_SMEE_URL
```

**Example:**
```
APP_ID=2295868
PRIVATE_KEY_PATH=./private-key.pem
WEBHOOK_SECRET=my_secret_key_123
LOG_LEVEL=debug
EMBEDDING_SERVER=http://localhost:8001
WEBHOOK_PROXY_URL=https://smee.io/zLPti39MV7HnAO4z
```

### Step 5: Add Private Key

1. Save the downloaded `.pem` file as:
   ```
   echofinder/private-key.pem
   ```

---

## 🏃 Running the Bot

You need to run **3 services** in separate terminals:

### Terminal 1: Python Embedding Service

```bash
cd echofinder
python embedding_service.py
```

Expected output:
```
✓ Model loaded successfully.
INFO:     Uvicorn running on http://127.0.0.1:8001
```

**What it does:** Provides semantic embeddings via HTTP API using Sentence-BERT

### Terminal 2: Smee Webhook Forwarder

```bash
smee -u https://smee.io/YOUR_SMEE_URL -t http://localhost:3000/api/github/webhooks
```

Expected output:
```
Forwarding https://smee.io/YOUR_SMEE_URL to http://localhost:3000/api/github/webhooks
Connected https://smee.io/YOUR_SMEE_URL
```

**What it does:** Forwards GitHub webhooks from smee.io to your local bot

### Terminal 3: Probot Bot Server

```bash
cd echofinder
npm start
```

Expected output:
```
🤖 EchoFinder Bot initialized
INFO (server): Listening on http://localhost:3000
INFO (server): Connected
```

**What it does:** Runs the GitHub bot that processes issues

---

## 🧪 Testing

### 1. Install Bot on Your Repository

1. Go to: https://github.com/apps/YOUR_APP_NAME
2. Click **"Install"**
3. Select your test repository
4. Click **"Install & Authorize"**

### 2. Create Test Issues

Go to your repository and create these issues:

**Issue #1 (Base Issue):**
- Title: `Payment button is greyed out`
- Description: `When I try to checkout with PayPal, the payment button appears disabled and I cannot proceed.`

**Issue #2 (Duplicate - to test bot):**
- Title: `Cannot complete purchase - PayPal button disabled`
- Description: `The PayPal checkout button is not clickable. I've tried multiple times but cannot proceed with payment.`

### 3. Watch Terminal Output

When you create Issue #2, Terminal 3 should show:

```
==================================================
📋 NEW ISSUE DETECTED
Repository: username/repo-name
Issue #2: Cannot complete purchase - PayPal button disabled
==================================================

📡 Fetching all open issues from repository...
✓ Found 1 other open issues

🔍 Starting similarity comparison...
New issue text length: 95 chars
Comparing against 1 issues

🔗 Calling embedding server: http://localhost:8001/compare
✓ Embedding server responded

🎯 RESULTS:
Best match: Issue #1
Title: "Payment button is greyed out"
Score: 87.3%
Threshold: 70.0%

✅ SCORE ABOVE THRESHOLD - Posting comment...

✅ Comment posted successfully
🏷️ Label "duplicate?" added

==================================================
```

### 4. Check GitHub Issue

Go back to Issue #2 on GitHub. You should see:
- ✅ Bot comment with similarity score
- ✅ "duplicate?" label added

---

## 📁 Project Structure

```
echofinderai-bot/
├── echofinder/                    # Probot application
│   ├── .env                       # Configuration (NOT in git)
│   ├── private-key.pem            # GitHub App key (NOT in git)
│   ├── index.js                   # Main bot logic
│   ├── package.json               # Node.js dependencies
│   └── node_modules/              # Dependencies (NOT in git)
│
├── embedding_service.py           # Python embedding microservice
├── test-embedding.js              # Test script for embeddings
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
└── requirements.txt               # Python dependencies (optional)
```

---

## 🔧 Configuration Options

### Similarity Threshold

Edit `echofinder/index.js`:

```javascript
const SIMILARITY_THRESHOLD = 0.70; // Change to 0.50 for more matches, 0.85 for stricter
```

- **0.50** = More matches detected (may have false positives)
- **0.70** = Balanced (default)
- **0.85** = Strict (only very similar issues)

### Model Selection

Edit `embedding_service.py` to use different models:

```python
# Fast model (recommended)
model = SentenceTransformer('all-MiniLM-L6-v2')

# More accurate but slower
model = SentenceTransformer('all-mpnet-base-v2')

# Lightweight
model = SentenceTransformer('all-distilroberta-v1')
```

---

## 🐛 Troubleshooting

### Issue: "Signature does not match"

**Problem:** Webhook signature verification failed

**Solution:**
1. Check `.env` has correct `WEBHOOK_SECRET`
2. Make sure you copied it from GitHub App settings, not from webhook headers
3. Restart the bot after changing `.env`

### Issue: "Private key does not exists"

**Problem:** Cannot find `private-key.pem`

**Solution:**
1. Verify file is in `echofinder/private-key.pem`
2. Check `.env` has correct `PRIVATE_KEY_PATH=./private-key.pem`
3. Regenerate private key from GitHub App settings

### Issue: "Cannot connect to embedding server"

**Problem:** Python service not running

**Solution:**
1. Check Terminal 1 is running `python embedding_service.py`
2. Verify output shows `Uvicorn running on http://127.0.0.1:8001`
3. Test manually: `curl http://localhost:8001/docs`

### Issue: Bot doesn't respond to issues

**Problem:** Bot not installed or not receiving webhooks

**Solution:**
1. Check bot is installed on repo: https://github.com/apps/YOUR_APP_NAME/installations
2. Verify all 3 terminals are running
3. Check Terminal 2 (smee) shows incoming webhooks
4. Check `WEBHOOK_SECRET` matches GitHub settings

### Issue: Low similarity scores

**Problem:** Bot not finding duplicates even for similar issues

**Solution:**
1. Lower `SIMILARITY_THRESHOLD` in `index.js` (try 0.50)
2. Check issue titles/bodies have enough detail
3. Very short issues may not match well

---

## 📊 Model Performance

**Sentence-BERT (all-MiniLM-L6-v2):**
- ⚡ Fast inference (~100ms per comparison)
- 📊 Good accuracy for duplicate detection
- 💾 Lightweight (133MB)
- ✅ Works offline

**Accuracy Examples:**
- Exact duplicates: 95%+
- Related issues: 60-80%
- Unrelated: <20%

---

## 🔐 Security Notes

⚠️ **Never commit sensitive files:**
- `.env` (contains secrets)
- `private-key.pem` (GitHub App key)

These are in `.gitignore` for protection.

**For production:**
1. Use environment variables instead of `.env`
2. Store secrets in GitHub Secrets
3. Use HTTPS for webhook URLs
4. Rotate private keys regularly

---

## 📚 Technologies Used

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Bot Framework | Probot v13 | GitHub App management |
| Embeddings | Sentence-BERT | Semantic similarity |
| ML Backend | PyTorch | Deep learning inference |
| Web Server | FastAPI | Embedding microservice |
| Webhook Proxy | smee.io | Local development tunneling |
| Runtime | Node.js 20+ | Bot runtime |

---

## 📖 API Endpoints

### Embedding Service (http://localhost:8001)

**POST `/compare`**
```json
{
  "new_text": "Payment button broken",
  "old_texts": ["Cannot checkout", "Issue with payments"]
}
```

Response:
```json
{
  "new_text": "Payment button broken",
  "scores": [0.85, 0.62],
  "best_match_index": 0,
  "best_score": 0.85,
  "threshold_met": true
}
```

---

## 🚀 Deployment

For production deployment, consider:

1. **AWS Lambda** + API Gateway for bot
2. **AWS RDS** for storing issue embeddings
3. **Docker** for containerization
4. **GitHub Actions** for CI/CD

Example Docker setup coming soon!

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review terminal output for error messages
3. Check GitHub webhook deliveries in app settings
4. Open an issue on GitHub

---

## 🎯 Future Improvements

- [ ] Store embeddings in vector database (ChromaDB)
- [ ] Custom similarity threshold per repo
- [ ] Batch processing for large repositories
- [ ] Dashboard UI for monitoring
- [ ] Support for different languages
- [ ] Integration with issue templates

---

**Happy bug hunting! 🐛** 

Made with ❤️ by EchoFinder Team