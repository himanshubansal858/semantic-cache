# Semantic Cache — Intelligent Caching for LLM Applications

An AI-powered semantic caching system built to reduce redundant LLM requests, improve response latency, and make LLM-powered applications more efficient.

Unlike traditional caching, which relies on exact string matching, Semantic Cache understands the meaning of questions using vector embeddings and cosine similarity. It can reuse previously generated answers when a new question is semantically equivalent to an existing cached query.

The system also incorporates answer-aware validation, Redis distributed locking, fault-tolerant fallbacks, and a real-time analytics dashboard.

### Live Demo

[**Try Semantic Cache**](https://semantic-cache-self.vercel.app)

[**Backend API**](https://semantic-cache-api-xlem.onrender.com)

---

## Why Semantic Cache?

Consider two questions:

- "What is a binary search tree?"
- "Explain the binary search tree data structure."

Although the wording is different, both questions ask for essentially the same information.

A traditional cache would treat them as separate requests, potentially triggering two LLM generations.

Semantic Cache instead:

1. Converts the question into a vector embedding.
2. Searches Redis for semantically similar cached questions.
3. Evaluates the similarity and validates candidate answers.
4. Returns a suitable cached answer or generates a new one using Groq.
5. Stores newly generated answers for future reuse.

This helps reduce unnecessary LLM requests while prioritizing answer correctness.

---

## Key Features

### 1. Semantic Vector Search

- Generates 768-dimensional embeddings using Hugging Face MPNet.
- Uses Redis vector search with cosine similarity.
- Retrieves the top three nearest cached candidates.
- Supports semantic matching across differently worded questions.

### 2. Local Embedding Generation

- Uses `Xenova/all-mpnet-base-v2`.
- Runs inference locally inside the Node.js backend.
- Avoids external embedding API calls.
- Reuses the loaded model for subsequent requests.

### 3. Answer-Aware Validation

High vector similarity does not always mean two questions have the same answer.

The system uses additional validation and technical conflict checks to reduce incorrect cache hits.

### 4. Distributed Locking

- Implements Redis-based distributed locks.
- Helps prevent duplicate LLM generation for concurrent requests.
- Uses atomic lock operations to coordinate cache updates.
- Includes lock release and bounded waiting behavior.

### 5. Fault-Tolerant Architecture

- Supports fallback behavior when Redis or caching operations fail.
- Handles external API failures.
- Includes request error handling and rate limiting.

### 6. Cache Expiration

- Supports TTL-based expiration.
- Prevents cached entries from remaining indefinitely.
- Provides cache deletion functionality.

### 7. Real-Time Analytics Dashboard

The React dashboard tracks:

- Total requests
- Cache hits and misses
- Cache-hit rate
- Average response latency
- Cache-hit versus cache-miss latency
- LLM API calls
- Observed caching speedup

### 8. Interactive API Playground

- Submit questions directly from the dashboard.
- View generated or cached answers.
- Inspect cache-hit status and similarity scores.

---

## Tech Stack

| Category             | Technologies                 |
| -------------------- | ---------------------------- |
| Backend              | Node.js, Express.js          |
| Frontend             | React, Vite, Tailwind CSS    |
| Analytics            | Recharts                     |
| Database             | Redis Cloud                  |
| Vector Search        | Redis Search                 |
| Embeddings           | Hugging Face Transformers.js |
| Embedding Model      | `Xenova/all-mpnet-base-v2`   |
| Embedding Dimensions | 768                          |
| LLM Provider         | GroqCloud                    |
| LLM Model            | `openai/gpt-oss-20b`         |
| Backend Hosting      | Render                       |
| Frontend Hosting     | Vercel                       |
| Testing              | Node.js Test Runner          |

---

## System Architecture

```text
                     User Question
                           |
                           v
                   Express.js API
                           |
                           v
                  Local MPNet Model
                   768D Embedding
                           |
                           v
                   Redis Vector Search
                           |
                           v
                    Top-K Candidates
                           |
                           v
                Similarity & Validation
                           |
                +----------+----------+
                |                     |
                v                     v
            Cache Hit             Cache Miss
                |                     |
                v                     v
         Cached Response       Distributed Lock
                |                     |
                |                     v
                |               Groq LLM API
                |                     |
                |                     v
                |             Generate New Answer
                |                     |
                |                     v
                |              Store in Redis
                |                     |
                +----------+----------+
                           |
                           v
                    Return Response
                           |
                           v
                    Update Analytics
```

---

## Redis Vector Configuration

The active local embedding index uses:

| Property        | Value                      |
| --------------- | -------------------------- |
| Index name      | `idx:semantic_cache_mpnet` |
| Key prefix      | `mpnet:cache:`             |
| Vector type     | FLOAT32                    |
| Dimensions      | 768                        |
| Distance metric | COSINE                     |
| Index algorithm | FLAT                       |
| Embedding model | MPNet                      |

The original Gemini-based index is maintained separately as `idx:semantic_cache`.

**Important:** Embeddings from different models cannot be mixed, even if they have identical dimensions. Separate namespaces prevent incompatible vectors from being searched together.

---

## Getting Started

### Prerequisites

Install or configure:

- Node.js
- npm
- Redis with vector-search support, or Redis Cloud
- Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/himanshubansal858/semantic-cache.git
cd semantic-cache
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development

REDIS_URL=your_redis_connection_url

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b

EMBEDDING_PROVIDER=local

ADMIN_API_KEY=your_admin_api_key
```

Never commit your actual API keys or Redis credentials.

### 4. Start the backend

```bash
npm run dev
```

The backend runs locally at:

`http://localhost:5000`

The first embedding request may download and initialize the local MPNet model.

### 5. Start the frontend

Open another terminal:

```bash
cd dashboard
npm install
npm run dev
```

Open the local URL displayed by Vite.

---

## API Endpoints

### Ask a Question

**POST `/api/ask`**

Request:

```json
{
  "question": "What is Redis?"
}
```

Example response on a cache miss:

```json
{
  "success": true,
  "question": "What is Redis?",
  "answer": "Redis is an in-memory data store...",
  "cache": {
    "hit": false,
    "stored": true,
    "redisAvailable": true,
    "message": "Answer generated and stored in cache"
  }
}
```

Example cache-hit information:

```json
{
  "hit": true,
  "similarity": 1.0,
  "redisAvailable": true
}
```

### Get Analytics

**GET `/api/analytics`**

Returns statistics about cache usage, response times, and LLM calls.

The dashboard consumes this endpoint to display real-time analytics.

---

## Performance

Semantic Cache is designed to reduce redundant LLM inference by serving previously validated answers.

During local testing, the MPNet embedding model produced 768-dimensional vectors with the following observed timings:

| Measurement                          |      Time |
| ------------------------------------ | --------: |
| First embedding after initialization | 787.72 ms |
| Warm embedding 1                     |  18.03 ms |
| Warm embedding 2                     |  10.34 ms |
| Warm embedding 3                     |  14.26 ms |
| Average warm embedding time          |  14.21 ms |

Local testing also showed stable memory usage:

| Measurement                    | RSS Memory |
| ------------------------------ | ---------: |
| Before model initialization    |   63.20 MB |
| After model initialization     |  226.19 MB |
| After 20 sequential embeddings |  224.73 MB |

These figures come from development measurements rather than controlled production benchmarks.

Actual performance depends on server resources, traffic patterns, model initialization, cache contents, and LLM response times.

The deployed analytics dashboard continuously calculates cache-hit rates and observed latency differences.

---

## Testing

The project includes automated backend tests covering caching behavior, validation, and reliability.

Run:

```bash
node --experimental-test-module-mocks --test
```

The backend test suite has previously passed **64 automated tests**.

Additional manual verification has covered:

- Cache misses and answer storage
- Exact cache hits
- Semantic cache retrieval
- Redis vector index initialization
- Distributed locking
- Groq answer generation
- Local MPNet embedding generation
- Production API integration

---

## Deployment

The application uses a split deployment architecture.

### Backend — Render

The Express backend runs on Render and handles:

- API requests
- Local embedding inference
- Redis vector search
- Cache validation
- Groq LLM requests
- Distributed locking
- Analytics

**Backend URL:** [https://semantic-cache-api-xlem.onrender.com](https://semantic-cache-api-xlem.onrender.com)

### Frontend — Vercel

The React dashboard is deployed on Vercel.

**Frontend URL:** [https://semantic-cache-self.vercel.app](https://semantic-cache-self.vercel.app)

### Redis Cloud

Redis Cloud stores:

- Cached questions and answers
- Vector embeddings
- Distributed locks
- Analytics counters

### Deployment Considerations

- Local MPNet inference consumes server memory.
- Cold starts may require model initialization or downloading model files.
- Groq usage remains subject to account and model-specific rate limits.
- The public demo uses rate limiting to reduce abusive traffic.

---

## Engineering Challenges

### Preventing Incorrect Cache Hits

A high cosine similarity score does not guarantee that two questions are equivalent.

Answer-aware validation and technical conflict checks help reduce false-positive cache matches.

### Handling Concurrent Requests

Without coordination, simultaneous requests for the same uncached question may trigger duplicate LLM calls.

Redis distributed locking helps coordinate these requests and reduce redundant generation.

### Reducing External API Dependencies

The initial implementation used hosted embeddings.

The project was later migrated to local MPNet embeddings, eliminating external embedding API calls from the active local-embedding configuration.

### Managing Failure Scenarios

The backend includes fallback logic and error handling to support continued operation when parts of the caching infrastructure are unavailable.

---

## Future Improvements

- Global daily LLM request budgeting
- More extensive performance benchmarking
- P95 and P99 latency monitoring
- Additional embedding model benchmarking
- Improved cache invalidation strategies
- Production monitoring and alerting
- Model preloading and cold-start optimization

---

## Author

**Himanshu Bansal**

GitHub: [https://github.com/himanshubansal858](https://github.com/himanshubansal858)

---

If you find this project useful, consider giving the repository a star!
