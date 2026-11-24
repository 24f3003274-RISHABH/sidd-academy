import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ENV from '../config/env.js';

const execFileAsync = promisify(execFile);

// Default Google Drive folder created in the admin's Google Drive: "Sidd Academy Study Materials"
const DEFAULT_GDRIVE_FOLDER_ID = '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf';

/**
 * Google Drive Integration Service for Sidd Academy Study Materials
 *
 * Saves admin-uploaded study material PDFs directly into the admin's Google Drive
 * ("Sidd Academy Study Materials") and resolves embeddable / downloadable Google Drive
 * links and streams for students in the Course Portal.
 */
export class GoogleDriveService {
  constructor() {
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || ENV.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_GDRIVE_FOLDER_ID;
    this.pdfMemoryCache = new Map();
  }

  /**
   * Fetch a publicly shared Google Drive PDF directly over HTTPS on the server.
   * This avoids embedding Google Drive's /preview iframe in the browser, which fails
   * with "Allow Google Drive access to your necessary cookies" when third-party cookies are blocked.
   */
  async fetchPublicDrivePdfBuffer(driveFileId) {
    if (!driveFileId) return null;

    // 1. Bounded in-memory cache (up to 15 PDFs, 30 min TTL)
    const cached = this.pdfMemoryCache.get(driveFileId);
    if (cached && Date.now() - cached.cachedAt < 30 * 60 * 1000 && cached.buffer?.length > 5) {
      return cached.buffer;
    }

    const candidateUrls = [
      `https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveFileId)}&export=download&confirm=t`,
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveFileId)}&confirm=t`,
    ];

    const isPdfBuf = (buf) => Buffer.isBuffer(buf) && buf.length >= 5 && buf.subarray(0, 5).toString('utf8').startsWith('%PDF-');

    for (const url of candidateUrls) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const resp = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SiddAcademyServer/1.0)',
            Accept: 'application/pdf,application/octet-stream,*/*;q=0.8',
          },
        });
        clearTimeout(timer);

        if (!resp.ok) continue;

        const arrayBuf = await resp.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (isPdfBuf(buf)) {
          if (this.pdfMemoryCache.size >= 15) {
            const oldestKey = this.pdfMemoryCache.keys().next().value;
            if (oldestKey) this.pdfMemoryCache.delete(oldestKey);
          }
          this.pdfMemoryCache.set(driveFileId, { buffer: buf, cachedAt: Date.now() });
          return buf;
        }
      } catch (err) {
        clearTimeout(timer);
        console.warn('⚠️ [GoogleDrive] Public HTTPS PDF proxy notice:', err.message);
      }
    }

    return null;
  }

  /**
   * Resolve the gdrive CLI binary path if available on the host (prefers PATH shims first)
   */
  resolveGdriveBinary() {
    const pathDirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
    for (const dir of pathDirs) {
      const candidate = path.join(dir, 'gdrive');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    const fallbacks = [
      path.join(os.homedir(), '.gemini/antigravity/bin/gdrive'),
      path.join(os.homedir(), '.gemini/config/plugins/gdrive/skills/gdrive/scripts/gdrive'),
    ];
    for (const candidate of fallbacks) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return 'gdrive';
  }

  /**
   * Extract a Google Drive File ID from a Google Drive URL or raw ID
   */
  extractDriveFileId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Direct /file/d/<ID> or /d/<ID> pattern
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    if (dMatch) return dMatch[1];

    // Query parameter ?id=<ID> or &id=<ID>
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (idParamMatch) return idParamMatch[1];

    // Bare Google Drive file ID (typically 28-44 chars alphanumeric, _, -)
    if (!trimmed.includes('/') && !trimmed.includes('.') && /^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  /**
   * Build standard Google Drive URLs for a given Drive File ID
   */
  buildDriveUrls(driveFileId) {
    if (!driveFileId) {
      return {
        driveFileId: null,
        driveViewUrl: null,
        drivePreviewUrl: null,
        driveDownloadUrl: null,
      };
    }

    return {
      driveFileId,
      driveViewUrl: `https://drive.google.com/file/d/${driveFileId}/view?usp=drivesdk`,
      drivePreviewUrl: `https://drive.google.com/file/d/${driveFileId}/preview`,
      driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${driveFileId}`,
    };
  }

  /**
   * Upload a local PDF / study material file to the admin's Google Drive folder
   *
   * @param {string} localFilePath - Absolute path to the uploaded file on disk
   * @param {Object} options - { fileName, title, folderId, mimeType }
   * @returns {Promise<{ driveFileId: string|null, driveFolderId: string, driveViewUrl: string|null, drivePreviewUrl: string|null, driveDownloadUrl: string|null, storageProvider: string }>}
   */
  async uploadFileToDrive(localFilePath, { fileName, title, folderId, mimeType = 'application/pdf' } = {}) {
    const targetFolderId = folderId || this.folderId;
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      return {
        driveFileId: null,
        driveFolderId: targetFolderId,
        driveViewUrl: null,
        drivePreviewUrl: null,
        driveDownloadUrl: null,
        storageProvider: 'local',
      };
    }

    const desiredName = (fileName || (title ? `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : path.basename(localFilePath))).trim();

    // Strategy 1: Use gdrive CLI connected to the admin's Google Drive account
    try {
      const bin = this.resolveGdriveBinary();
      const args = ['mutate', 'upload', localFilePath, '--mime-type', mimeType];
      if (targetFolderId) {
        args.push('--parent', targetFolderId);
      }

      const { stdout } = await execFileAsync(bin, args, { timeout: 30000 });
      const idMatch = String(stdout).match(/ID:\s*([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        const driveFileId = idMatch[1];

        // Rename the uploaded file in Google Drive to the clean original file name if different
        if (desiredName && desiredName !== path.basename(localFilePath)) {
          try {
            await execFileAsync(bin, ['mutate', 'rename', driveFileId, desiredName], { timeout: 15000 });
          } catch (renameErr) {
            console.warn('⚠️ [GoogleDrive] Rename notice:', renameErr.message);
          }
        }

        return {
          ...this.buildDriveUrls(driveFileId),
          driveFolderId: targetFolderId,
          storageProvider: 'gdrive',
        };
      }
    } catch (cliErr) {
      console.warn('⚠️ [GoogleDrive] CLI upload fallback notice:', cliErr.message);
    }

    // Strategy 2: Use Google Drive REST API v3 if GOOGLE_DRIVE_ACCESS_TOKEN is configured
    const accessToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN || ENV.GOOGLE_DRIVE_ACCESS_TOKEN;
    if (accessToken) {
      try {
        const metadata = {
          name: desiredName,
          mimeType,
          ...(targetFolderId ? { parents: [targetFolderId] } : {}),
        };
        const boundary = `-------sidd_gdrive_${Date.now()}`;
        const fileBuffer = fs.readFileSync(localFilePath);
        const preamble = Buffer.from(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
          'utf8'
        );
        const epilogue = Buffer.from(`\r\n--${boundary}--`, 'utf8');
        const bodyBuffer = Buffer.concat([preamble, fileBuffer, epilogue]);

        const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: bodyBuffer,
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.id) {
            return {
              ...this.buildDriveUrls(data.id),
              driveFolderId: targetFolderId,
              storageProvider: 'gdrive',
            };
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ [GoogleDrive] REST API upload notice:', apiErr.message);
      }
    }

    return {
      driveFileId: null,
      driveFolderId: targetFolderId,
      driveViewUrl: null,
      drivePreviewUrl: null,
      driveDownloadUrl: null,
      storageProvider: 'local',
    };
  }

  /**
   * Download a file from Google Drive to a local cache path for authenticated portal streaming
   */
  async downloadFileFromDrive(driveFileId, destinationPath) {
    if (!driveFileId) return false;
    try {
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const bin = this.resolveGdriveBinary();
      await execFileAsync(bin, ['readonly', 'download', driveFileId, '--out', destinationPath], { timeout: 30000 });
      return fs.existsSync(destinationPath);
    } catch (err) {
      console.warn('⚠️ [GoogleDrive] Download from Drive notice:', err.message);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
