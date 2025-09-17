const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
}

export type FileFormat = 'webm' | 'wav' | 'mp3' | 'm4a' | 'txt';
export type FileType = 'audio' | 'text';

export type GetUploadUrlResponse = {
  success: boolean;
  upload_url: string; // 署名付きPUT URL
  file_path: string; // ← DBに保存すべき「S3キー」
  s3_url: string; // 参考（表示用）
  content_type: string; // PUT時にそのまま使う
};

export type TranscribeResponse = {
  success: boolean;
  transcription_id: number;
  text: string;
  confidence: number;
  language: string;
  duration: number;
  processed_at: string;
};

export type SaveRecordResponse = {
  success: boolean;
  record_id: string; // EmotionLog.id が UUID のため string
  message: string;
};

export type RecordsResponse = {
  success: boolean;
  records: Array<{
    id: string;
    audio_path: string | null;
    text_path: string | null;
    audio_download_url: string | null;
    text_download_url: string | null;
    created_at: [string, string] | null; // ["YYYYMMDD","HHMMSS"] 想定
  }>;
};

// API calls

export async function getUploadUrl(opts: {
  userId: string; // UUID
  fileType: FileType; // 'audio' | 'text'
  fileFormat: FileFormat; // 'webm' | 'm4a' | ...
}): Promise<GetUploadUrlResponse> {
  const res = await fetch(`${API_BASE}/api/v1/voice/get-upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: opts.userId,
      file_type: opts.fileType,
      file_format: opts.fileFormat,
    }),
  });
  if (!res.ok)
    throw new Error(`get-upload-url failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function putToS3(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!res.ok)
    throw new Error(`S3 PUT failed: ${res.status} ${await res.text()}`);
}

export async function transcribe(opts: {
  userId: string; // UUID
  audioKey: string; // ← S3の「キー」(例: audio/<uuid>/audio_...webm)
  language?: 'ja' | 'en';
}): Promise<TranscribeResponse> {
  const res = await fetch(`${API_BASE}/api/v1/voice/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // バックエンドはS3キーのみを受け取る
    body: JSON.stringify({
      user_id: opts.userId,
      audio_file_path: opts.audioKey,
      language: opts.language ?? 'ja',
    }),
  });
  if (!res.ok)
    throw new Error(`transcribe failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function saveRecord(opts: {
  userId: string; // UUID
  audioKey: string; // S3キー
  textKey?: string | null; // S3キー(任意)
}): Promise<SaveRecordResponse> {
  const res = await fetch(`${API_BASE}/api/v1/voice/save-record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: opts.userId,
      audio_file_path: opts.audioKey,
      text_file_path: opts.textKey ?? null,
    }),
  });
  if (!res.ok)
    throw new Error(`save-record failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fetchRecords(userId: string): Promise<RecordsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/voice/records/${userId}`);
  if (!res.ok)
    throw new Error(`fetch-records failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// helper: 今日の分があるか（created_atのYYYYMMDDで判定）
export function hasTodaysRecord(records: RecordsResponse['records']): boolean {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  return records.some((r) => r.created_at?.[0] === ymd);
}
