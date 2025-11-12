import os
import math
from typing import List, Optional

try:
    from supabase import create_client
except Exception:
    create_client = None  # supabase client optional; retrieval will skip if unavailable

try:
    import requests
except Exception:
    requests = None

try:
    import voyage
except Exception:
    voyage = None
    try:
        # some installs expose the package as `voyageai`
        import voyageai as voyage
    except Exception:
        voyage = None

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except Exception:
    psycopg2 = None
    RealDictCursor = None

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'text-embedding-3-small')


def _get_supabase_client():
    if not create_client or not SUPABASE_URL or not SUPABASE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_embedding(text: str) -> Optional[List[float]]:
    """Get embedding vector for a given text using Voyage AI (preferred) or OpenAI as fallback.

    Uses VOYAGE_API_KEY if present to call Voyage embeddings. Falls back to OpenAI if configured.
    Returns None if no provider is configured.
    """
    # Prefer Voyage AI if configured (local env VOYAGE_API_KEY)
    VOYAGE_KEY = os.environ.get('VOYAGE_API_KEY')
    print(f'[get_embedding] VOYAGE_KEY present: {bool(VOYAGE_KEY)}, voyage module: {voyage is not None}')
    if voyage and VOYAGE_KEY:
        try:
            model = os.environ.get('VOYAGE_EMBEDDING_MODEL', 'voyage-3-large')
            print(f'[get_embedding] Using Voyage with model={model}')
            # voyage.Client will pick up env var if not passed; pass explicitly for clarity
            # voyage and voyageai expose Client
            client = getattr(voyage, 'Client')(api_key=VOYAGE_KEY)
            # newer voyageai client uses embed or embeddings API; try common call
            if hasattr(client, 'embed'):
                resp = client.embed(text, model=model)
            elif hasattr(client, 'embeddings'):
                resp = client.embeddings.create(input=text, model=model)
            else:
                resp = None
            print(f'[get_embedding] Voyage response: {resp is not None}')
            emb = None
            # voyage examples return an object with .embeddings
            if hasattr(resp, 'embeddings'):
                emb = resp.embeddings
            elif isinstance(resp, dict):
                emb = resp.get('embeddings')
            # Some clients return [[vec]] (batch) — flatten to a single vector
            if isinstance(emb, list) and len(emb) > 0 and isinstance(emb[0], (list, tuple)):
                emb = emb[0]
            if emb:
                print(f'[get_embedding] Voyage embedding successful, vector length: {len(emb)}')
                return emb
        except Exception as e:
            print(f'[get_embedding] Voyage embedding failed: {type(e).__name__}: {e}')
            print('Voyage embedding call failed:', e)

    # Anthropic/Claude does not currently provide public embeddings for many models;
    # prefer Voyage when available, otherwise fall back to OpenAI embeddings.

    # Fallback: try OpenAI (if available)
    OPENAI_KEY = os.environ.get('OPENAI_API_KEY')
    print(f'[get_embedding] OPENAI_KEY present: {bool(OPENAI_KEY)}, requests module: {requests is not None}')
    if requests and OPENAI_KEY:
        try:
            print(f'[get_embedding] Using OpenAI with model={EMBEDDING_MODEL}')
            url = 'https://api.openai.com/v1/embeddings'
            headers = {
                'Authorization': f'Bearer {OPENAI_KEY}',
                'Content-Type': 'application/json'
            }
            payload = {'model': EMBEDDING_MODEL, 'input': text}
            r = requests.post(url, headers=headers, json=payload, timeout=30)
            r.raise_for_status()
            j = r.json()
            emb = j.get('data', [])[0].get('embedding') if j.get('data') else None
            if emb:
                print(f'[get_embedding] OpenAI embedding successful, vector length: {len(emb)}')
                return emb
        except Exception as e:
            print(f'[get_embedding] OpenAI embedding failed: {type(e).__name__}: {e}')
            print('OpenAI embedding call failed:', e)

    print('[get_embedding] No embedding provider available')
    return None


def ingest_text(content: str) -> bool:
    """Ingest a text chunk into Supabase embeddings table.

    Returns True if insert succeeded, False otherwise. Skips if Supabase not configured.
    """
    # Try Postgres ingestion first if DSN provided
    POSTGRES_DSN = os.environ.get('POSTGRES_DSN')
    print(f'[ingest_text] POSTGRES_DSN present: {bool(POSTGRES_DSN)}')
    emb = get_embedding(content)
    print(f'[ingest_text] embedding result: {emb is not None}, emb_len: {len(emb) if emb else 0}')
    if emb is None:
        print('Embedding not available; skipping ingest')
        return False

    if POSTGRES_DSN and psycopg2:
        try:
            conn = psycopg2.connect(POSTGRES_DSN)
            cur = conn.cursor()
            # convert embedding list to Postgres array literal
            emb_pg = '{' + ','.join(str(float(x)) for x in emb) + '}'
            cur.execute("INSERT INTO embeddings (content, embedding) VALUES (%s, %s::vector)", (content, emb_pg))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            print('Postgres ingest failed:', e)

    # Fallback to Supabase ingestion
    supabase = _get_supabase_client()
    if not supabase:
        print('Supabase not configured; skipping ingest')
        return False

    try:
        payload = {'content': content, 'embedding': emb}
        res = supabase.table('embeddings').insert(payload).execute()
        # supabase client may return an object with .data or a dict-like result
        data = None
        if hasattr(res, 'data'):
            data = res.data
        elif isinstance(res, dict):
            data = res.get('data')
        elif hasattr(res, 'get'):
            try:
                data = res.get('data')
            except Exception:
                data = None
        if data:
            return True
    except Exception as e:
        print('Failed to ingest to supabase:', e)

    return False


def _cosine_sim(a: List[float], b: List[float]) -> float:
    # Compute cosine similarity between vectors a and b
    if not a or not b or len(a) != len(b):
        return -1.0
    dot = sum(x * y for x, y in zip(a, b))
    norma = math.sqrt(sum(x * x for x in a))
    normb = math.sqrt(sum(y * y for y in b))
    if norma == 0 or normb == 0:
        return -1.0
    return dot / (norma * normb)


def retrieve_similar_context(query: str, top_k: int = 5) -> List[str]:
    """Retrieve top_k similar content from Supabase embeddings.

    This implementation fetches all embeddings and computes cosine similarity locally.
    It's intentionally simple and works without Postgres vector operator support.
    Returns a list of content strings (may be empty).
    """
    # If local Postgres DSN is configured, prefer DB-side search there
    POSTGRES_DSN = os.environ.get('POSTGRES_DSN')
    query_emb = get_embedding(query)
    if query_emb is None:
        return []

    if POSTGRES_DSN and psycopg2:
        try:
            conn = psycopg2.connect(POSTGRES_DSN)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # pass embedding as Postgres array literal and cast to vector
            emb_pg = '{' + ','.join(str(float(x)) for x in query_emb) + '}'
            cur.execute(
                "SELECT content FROM embeddings ORDER BY embedding <-> (%s::vector) LIMIT %s",
                (emb_pg, top_k)
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return [r['content'] for r in rows if r.get('content')]
        except Exception as e:
            print('Postgres vector search failed:', e)

    # Else try Supabase RPC (if configured)
    supabase = _get_supabase_client()
    if supabase:
        try:
            rpc_res = supabase.rpc('match_embeddings', {
                'query_embedding': query_emb,
                'k': top_k
            }).execute()
            # handle APIResponse or dict
            data = None
            if hasattr(rpc_res, 'data'):
                data = rpc_res.data
            elif isinstance(rpc_res, dict):
                data = rpc_res.get('data')
            if data:
                return [r.get('content') for r in data if r.get('content')]
        except Exception as e:
            print('Supabase RPC match_embeddings failed or not present; falling back to client-side scoring:', e)

        try:
            res = supabase.table('embeddings').select('id,content,embedding').execute()
            if hasattr(res, 'data'):
                rows = res.data or []
            elif isinstance(res, dict):
                rows = res.get('data') or []
            else:
                # try attribute access
                rows = []
        except Exception as e:
            print('Failed to fetch embeddings from supabase:', e)
            return []

        scored = []
        for r in rows:
            emb = r.get('embedding')
            if not emb:
                continue
            try:
                score = _cosine_sim(query_emb, emb)
            except Exception:
                score = -1.0
            scored.append((score, r.get('content')))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = [c for _, c in scored[:top_k] if c]
        return results

    # Nothing configured
    return []
