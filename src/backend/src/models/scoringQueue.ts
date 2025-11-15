import { prisma } from '../lib/prisma';
import { ScoringModel } from './scoring';
import { SubmissionModel } from './submission';

interface ScoringJob {
  submissionId: number;
  priority: number;
  addedAt: Date;
}

class ScoringQueue {
  private queue: ScoringJob[] = [];
  private processing: Set<number> = new Set();
  private isRunning: boolean = false;
  private maxConcurrent: number = 3; // Maximum concurrent scoring jobs
  private delayBetweenJobs: number = 1000; // 1 second delay between jobs
  private processingCount: number = 0;

  constructor() {
    this.startProcessing();
  }

  /**
   * Add a submission to the scoring queue
   * @param submissionId - Submission ID to score
   * @param priority - Higher priority jobs are processed first (default: 0)
   */
  async addToQueue(submissionId: number, priority: number = 0): Promise<void> {
    // Check if submission exists
    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // Check if submission is already sent
    const isSent = await SubmissionModel.isSend(submissionId);

    if (!isSent) {
      throw new Error(`Submission ${submissionId} has not been sent yet`);
    }

    // Check if already in queue or being processed
    if (this.isInQueue(submissionId) || this.processing.has(submissionId)) {
      console.log(`Submission ${submissionId} is already in queue or being processed`);
      return;
    }

    // Add to queue
    this.queue.push({
      submissionId,
      priority,
      addedAt: new Date(),
    });

    // Sort queue by priority (higher first), then by time added
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.addedAt.getTime() - b.addedAt.getTime();
    });

    console.log(`Added submission ${submissionId} to scoring queue (priority: ${priority})`);
  }

  /**
   * Check if a submission is in the queue
   */
  private isInQueue(submissionId: number): boolean {
    return this.queue.some(job => job.submissionId === submissionId);
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.processQueue();
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    this.isRunning = false;
  }

  /**
   * Main queue processing loop
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      // Check if we can process more jobs
      if (this.processingCount < this.maxConcurrent && this.queue.length > 0) {
        const job = this.queue.shift();

        if (job) {
          // Process job without blocking the queue
          this.processJob(job).catch(err => {
            console.error(`Error processing job for submission ${job.submissionId}:`, err);
          });
        }
      }

      // Wait before checking queue again
      await this.sleep(this.delayBetweenJobs);
    }
  }

  /**
   * Process a single scoring job
   */
  private async processJob(job: ScoringJob): Promise<void> {
    const { submissionId } = job;

    try {
      this.processing.add(submissionId);
      this.processingCount++;

      console.log(`[Queue] Processing submission ${submissionId} (${this.processingCount}/${this.maxConcurrent} concurrent)`);

      // Run the mock scoring function
      await this.scoreSubmission(submissionId);

      console.log(`[Queue] Completed scoring submission ${submissionId}`);
    } catch (error) {
      console.error(`[Queue] Failed to score submission ${submissionId}:`, error);

      // Optionally re-queue failed jobs with lower priority
      // this.addToQueue(submissionId, Math.max(0, job.priority - 1));
    } finally {
      this.processing.delete(submissionId);
      this.processingCount--;
    }
  }

  /**
   * Mock scoring function
   * In a real system, this would call an ML model, run evaluation scripts, etc.
   */
  private async scoreSubmission(submissionId: number): Promise<void> {
    // Simulate time-consuming scoring process (2-5 seconds)
    const scoring = new ScoringModel(submissionId);
    await scoring.runScoringSandbox();
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: Array.from(this.processing),
      processingCount: this.processingCount,
      maxConcurrent: this.maxConcurrent,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get queue position for a submission
   */
  getPosition(submissionId: number): number | null {
    const index = this.queue.findIndex(job => job.submissionId === submissionId);
    return index === -1 ? null : index + 1;
  }

  /**
   * Update queue configuration
   */
  configure(options: { maxConcurrent?: number; delayBetweenJobs?: number }): void {
    if (options.maxConcurrent !== undefined) {
      this.maxConcurrent = Math.max(1, options.maxConcurrent);
    }
    if (options.delayBetweenJobs !== undefined) {
      this.delayBetweenJobs = Math.max(100, options.delayBetweenJobs);
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const scoringQueue = new ScoringQueue();
