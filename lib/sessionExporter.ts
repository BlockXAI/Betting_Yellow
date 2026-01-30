import { promises as fs } from 'fs';
import path from 'path';

export interface SessionData {
  sessionId: string;
  participants: string[];
  allocations: Record<string, string>;
  timestamp: number;
  rounds?: number;
}

export interface ExportResult {
  epochId: string;
  csvPath: string;
  jsonPath: string;
  totalLiabilities: string;
  participantCount: number;
}

export class SessionExporter {
  private baseDir: string;

  constructor(baseDir: string = './solvency/epochs') {
    this.baseDir = baseDir;
  }

  /**
   * Generate a unique epoch ID based on timestamp
   */
  generateEpochId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Ensure the epoch directory exists
   */
  private async ensureEpochDir(epochId: string): Promise<string> {
    const epochDir = path.join(this.baseDir, epochId);
    await fs.mkdir(epochDir, { recursive: true });
    return epochDir;
  }

  /**
   * Convert session allocations to CSV format
   */
  private generateCSV(allocations: Record<string, string>): string {
    const lines = ['address,balance'];
    
    for (const [address, balance] of Object.entries(allocations)) {
      lines.push(`${address},${balance}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Calculate total liabilities
   */
  private calculateTotalLiabilities(allocations: Record<string, string>): string {
    const total = Object.values(allocations).reduce(
      (sum, balance) => sum + parseFloat(balance),
      0
    );
    return total.toFixed(4);
  }

  /**
   * Export session data to CSV and JSON
   */
  async exportSession(sessionData: SessionData): Promise<ExportResult> {
    const epochId = this.generateEpochId();
    const epochDir = await this.ensureEpochDir(epochId);

    // Generate CSV
    const csv = this.generateCSV(sessionData.allocations);
    const csvPath = path.join(epochDir, 'liabilities.csv');
    await fs.writeFile(csvPath, csv, 'utf-8');

    // Generate JSON (full session data)
    const jsonPath = path.join(epochDir, 'session.json');
    const jsonData = {
      epochId,
      sessionId: sessionData.sessionId,
      participants: sessionData.participants,
      allocations: sessionData.allocations,
      timestamp: sessionData.timestamp,
      rounds: sessionData.rounds || 0,
      totalLiabilities: this.calculateTotalLiabilities(sessionData.allocations),
      exportedAt: Date.now(),
    };
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    // Generate metadata file
    const metadataPath = path.join(epochDir, 'metadata.json');
    const metadata = {
      epochId,
      exportedAt: new Date().toISOString(),
      participantCount: sessionData.participants.length,
      totalLiabilities: this.calculateTotalLiabilities(sessionData.allocations),
      sessionId: sessionData.sessionId,
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    return {
      epochId,
      csvPath,
      jsonPath,
      totalLiabilities: this.calculateTotalLiabilities(sessionData.allocations),
      participantCount: sessionData.participants.length,
    };
  }

  /**
   * List all exported epochs
   */
  async listEpochs(): Promise<string[]> {
    try {
      const epochs = await fs.readdir(this.baseDir);
      return epochs.filter(e => !e.startsWith('.'));
    } catch (err) {
      return [];
    }
  }

  /**
   * Get epoch metadata
   */
  async getEpochMetadata(epochId: string): Promise<any> {
    const metadataPath = path.join(this.baseDir, epochId, 'metadata.json');
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Read liabilities CSV for a specific epoch
   */
  async readLiabilitiesCSV(epochId: string): Promise<string> {
    const csvPath = path.join(this.baseDir, epochId, 'liabilities.csv');
    return await fs.readFile(csvPath, 'utf-8');
  }
}

// Default export instance
export const sessionExporter = new SessionExporter();
