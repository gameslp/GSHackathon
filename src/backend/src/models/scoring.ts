import { DockerRunConfig, runDockerTest } from "src/docker/runner";
import { SubmissionModel } from "./submission";
import os from "os";
import { SubmissionFile, SubmissionFileFormat, Submission as SubmissionType} from "@prisma/client";
import path from "path";
import { copyFile, copyFileSync } from "fs";
import { SubmissionFileFormatInclude, SubmissionFileInclude } from "src/generated/prisma/models";
import { ProvidedFileModel } from "./providedFile";
import { HackathonModel } from "./hackathon";
import { Session } from "inspector";

export class ScoringModel {
  public SubmissionId: number;
  public Submission: SubmissionType;
  public ScoreId: number;
  public static uploadDirectory: string = "../../uploads"

  public constructor(submissionId: number) {
    this.ScoreId = Math.random() * 1e9;
    this.SubmissionId = submissionId;
  }

  private async getSubmission(submissionId: number) {
    if(this.Submission && this.Submission.id === submissionId) return;

    const submission = await SubmissionModel.findByIdWithFiles(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }
    this.Submission = submission;
    return submission;
  }

  public async runScoringSandbox() {
    var submission = await this.getSubmission(this.SubmissionId);
    var hackathon = await HackathonModel.findById(submission.hackathonId);
    var files = submission.files;
    var organizerFiles = await ProvidedFileModel.findByHackathon(submission.hackathonId);

    const tempDir = os.tmpdir();
    const userSolutionDir = path.join(tempDir, `submission_${this.ScoreId}`);
    files.forEach((file) => {
      const filePath = path.join(ScoringModel.uploadDirectory, file.fileUrl);
      const destPath = path.join(userSolutionDir, file.fileFormat.name);
      copyFileSync(filePath, destPath);
    });

    const organizerFilesDir = path.join(tempDir, `organizer_files_${this.ScoreId}`);
    organizerFiles.forEach((file) => {
      const filePath = path.join(ScoringModel.uploadDirectory, file.fileUrl);
      const destPath = path.join(organizerFilesDir, file.name);
      copyFileSync(filePath, destPath);
    });


    const payload: DockerRunConfig = {
      userSolutionDir,
      organizerFilesDir,
      outputDir: path.join(tempDir, `output_${this.ScoreId}`),
      cpuLimit: hackathon.threadLimit,
      memoryLimit: `${hackathon.ramLimit}m`,
      timeout: hackathon.submissionTimeout,
    };

    const result = await runDockerTest(payload);
    
    if(result.error) {
      SubmissionModel.updateScoreComment(this.Submission.id, `CHECKER RUNTIME ERROR:\n${result.error}`, this.ScoreId);
    } else if (result.timedOut) {
      SubmissionModel.updateScoreComment(this.Submission.id, `⚠️ TIME LIMIT EXCEEDED (${hackathon.submissionTimeout}s)`, this.ScoreId);
    } else {
      SubmissionModel.update(this.Submission.id, {
        score: result.score,
        scoreComment: result.scoreComment,
        scoredAt: new Date(),
        scoreId: this.ScoreId,
        scoreManual: false,
      });
    }
  }
}