export class RequestBodyError extends Error {
  status: 400 | 413;

  constructor(message: string, status: 400 | 413) {
    super(message);
    this.name = 'RequestBodyError';
    this.status = status;
  }
}

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new RequestBodyError('İstek gövdesi çok büyük.', 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RequestBodyError('İstek gövdesi çok büyük.', 413);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestBodyError('Geçersiz istek.', 400);
  }
}
