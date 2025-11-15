# Docker Runner - ML/AI Testing Execution

## 📋 Description

Simple TypeScript module for running Docker with testing scripts. Organizers set resource limits (CPU, RAM, timeout) for each task.

## 📁 Structure

```
src/docker/
├── runner.ts       # Main file - runDockerTest() function
├── examples.ts     # Usage examples
└── README.md       # This documentation
```

## 🚀 Usage

### Import

```typescript
import { runDockerTest } from "./docker/runner";
```

### Basic Example

```typescript
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_123", // User's folder
	organizerFilesDir: "/var/tasks/task_001", // Organizer's folder (with tester)
	outputDir: "/var/results/user_123", // Output folder

	// ORGANIZER-DEFINED LIMITS
	cpuLimit: 2, // 2 CPU cores
	memoryLimit: "4g", // 4GB RAM
	timeout: 300, // 5 minutes
});

console.log("Success:", result.success);
console.log("Score:", result.score); // null or number (e.g., 85.5)
console.log("Comment:", result.scoreComment); // Full output
console.log("Time:", result.executionTime, "s");
```

## 🎯 Configuration Parameters (from organizer)

```typescript
interface DockerRunConfig {
	// PATHS (required)
	userSolutionDir: string; // Folder with user's files
	organizerFilesDir: string; // Folder with tester and test data
	outputDir: string; // Output folder

	// LIMITS (required - SET BY ORGANIZER)
	cpuLimit: number; // Number of CPU cores (e.g., 1, 2, 4, 8)
	memoryLimit: string; // RAM limit (e.g., '512m', '1g', '4g', '16g')
	timeout: number; // Timeout in seconds (e.g., 30, 300, 1800)

	// OPTIONAL
	testerFileName?: string; // Tester filename (default: 'tester.py')
	imageName?: string; // Docker image (default: 'ml-sandbox')
	containerName?: string; // Container name (default: auto-generated)
}
```

## 📊 Result

```typescript
interface DockerRunResult {
	success: boolean; // Whether test succeeded (exitCode === 0)
	exitCode: number; // Process exit code
	error?: string; // Stderr if occurred
	timedOut: boolean; // Whether timeout was exceeded
	executionTime: number; // Execution time in seconds

	// Fields ready for Submission model
	score: number | null; // Score parsed from output (null if error)
	scoreComment: string; // Formatted comment with full output
}
```

**NOTE**: The organizer's program (tester) should simply print a number (score), e.g., `"85.5"` or `"100"`. This number will be parsed and saved in the `score` field. The complete output with additional information goes to the `scoreComment` field.

## 🔒 Security (automatic)

All these protections are **always active**:

- ✅ `--network=none` - No internet access
- ✅ `--read-only` - Read-only filesystem
- ✅ `--user 1000:1000` - Non-root user
- ✅ `--cap-drop=ALL` - No capabilities
- ✅ `--security-opt=no-new-privileges` - No privilege escalation
- ✅ Read-only mounts for user and organizer folders
- ✅ Read-write mount only for outputDir

## 📝 Examples with Different Limits

### Simple Task (sorting algorithm)

```typescript
// Organizer sets small limits for simple task
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_123",
	organizerFilesDir: "/var/tasks/sorting",
	outputDir: "/var/results/user_123",
	cpuLimit: 1, // 1 core
	memoryLimit: "512m", // 512MB
	timeout: 30, // 30 seconds
});
```

### Machine Learning Task

```typescript
// Organizer sets medium limits
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_456",
	organizerFilesDir: "/var/tasks/ml_classification",
	outputDir: "/var/results/user_456",
	cpuLimit: 4, // 4 cores
	memoryLimit: "8g", // 8GB
	timeout: 600, // 10 minutes
});
```

### Deep Learning Task

```typescript
// Organizer sets large limits for heavy task
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_789",
	organizerFilesDir: "/var/tasks/deep_learning",
	outputDir: "/var/results/user_789",
	cpuLimit: 8, // 8 cores
	memoryLimit: "16g", // 16GB
	timeout: 1800, // 30 minutes
});
```

## 🎓 Backend Integration

### In Controller

```typescript
import { runDockerTest } from "../docker/runner";
import { prisma } from "@prisma";

async function submitSolution(req: Request, res: Response) {
	const { taskId, userId } = req.body;

	// 1. Fetch organizer-set limits from database
	const task = await prisma.task.findUnique({
		where: { id: taskId },
		select: {
			cpuLimit: true,
			memoryLimit: true,
			timeout: true,
		},
	});

	// 2. Run test with organizer's limits
	const result = await runDockerTest({
		userSolutionDir: `/var/submissions/${userId}`,
		organizerFilesDir: `/var/tasks/${taskId}`,
		outputDir: `/var/results/${userId}_${taskId}`,
		cpuLimit: task.cpuLimit, // From database
		memoryLimit: task.memoryLimit, // From database
		timeout: task.timeout, // From database
	});

	// 3. Save result
	await prisma.submission.create({
		data: {
			userId,
			taskId,
			score: result.score, // Float | null
			scoreComment: result.scoreComment, // String with full output
			executionTime: result.executionTime,
			success: result.success,
		},
	});

	return res.json({
		success: result.success,
		score: result.score,
	});
}
```

## 🗄️ Database Schema (example)

Organizer sets limits when creating task:

```prisma
model Task {
  id            String   @id @default(uuid())
  name          String
  description   String

  // ORGANIZER-SET LIMITS
  cpuLimit      Int      @default(2)        // Number of cores
  memoryLimit   String   @default("4g")     // RAM limit
  timeout       Int      @default(300)      // Timeout in seconds

  createdAt     DateTime @default(now())
  organizerId   String
  organizer     User     @relation(fields: [organizerId], references: [id])
  submissions   Submission[]
}
```

## 🔧 Tester Format (in organizer's folder)

Tester is a Python file at `organizerFilesDir/tester.py`:

**IMPORTANT**: The tester should simply print a number (score) to stdout. This number will be automatically parsed.

```python
import sys
import json

def main():
    submission_dir = sys.argv[1]  # /submission
    output_dir = sys.argv[2]      # /output

    # Load user's solution
    sys.path.insert(0, submission_dir)
    from solution import solve

    # Run tests and calculate score
    score = evaluate_solution(solve)

    # PRINT SCORE TO STDOUT (this will be parsed)
    print(score)  # e.g., "85.5" or "100"

    # Optionally: save details to /output/result.json
    with open(f'{output_dir}/result.json', 'w') as f:
        json.dump({
            "score": score,
            "details": "All tests passed"
        }, f)

    sys.exit(0)

def evaluate_solution(solve_fn):
    # Your testing logic
    # ...
    return 85.5  # Example result

if __name__ == "__main__":
    main()
```

**Example of simpler tester:**

```python
#!/usr/bin/env python3
import sys

# Load user's solution
sys.path.insert(0, sys.argv[1])
from solution import solve

# Tests
test_cases = [
    ([1, 2, 3], 6),
    ([4, 5], 9),
    ([10], 10)
]

correct = 0
for input_data, expected in test_cases:
    result = solve(input_data)
    if result == expected:
        correct += 1

# Print score (percentage correct)
score = (correct / len(test_cases)) * 100
print(score)  # e.g., "100" or "66.66666666666667"
```

## 📂 Folder Structure

```
/var/tasks/task_001/              # Organizer's folder
├── tester.py                     # Tester (REQUIRED)
├── test_data.csv                 # Test data (optional)
└── expected_output.txt           # Expected results (optional)

/var/submissions/user_123/        # User's folder
└── solution.py                   # User's solution

/var/results/user_123/            # Output folder
├── result.json                   # Result from tester
└── output.log                    # Logs (optional)
```

## ⚙️ Requirements

1. **Docker installed and running**

   ```bash
   docker --version
   ```

2. **ml-sandbox image built**

   ```bash
   docker build -f Dockerfile.ai -t ml-sandbox .
   ```

3. **Directories created with proper permissions**
   ```bash
   mkdir -p /var/tasks /var/submissions /var/results
   chown -R 1000:1000 /var/tasks /var/submissions /var/results
   ```

## 🐛 Error Handling

```typescript
const result = await runDockerTest({...});

if (result.timedOut) {
  console.log('Timeout exceeded!');
  console.log('Score:', null);
  console.log('Comment:', result.scoreComment);
} else if (!result.success) {
  console.log('Test failed with error:', result.error);
  console.log('Score:', result.score);  // Probably null
} else {
  console.log('Test OK!');
  console.log('Score:', result.score);  // e.g., 85.5
  console.log('Time:', result.executionTime, 's');
}
```

### Example `scoreComment` Values:

**Success:**

```
Status: SUCCESS
Exit code: 0
Execution time: 2.34s

OUTPUT:
85.5
```

**Timeout:**

```
Status: ERROR
Exit code: 124
Execution time: 300.00s
⚠️ TIMEOUT EXCEEDED

ERRORS:
Test exceeded time limit of 300s
```

**Error:**

```
Status: ERROR
Exit code: 1
Execution time: 0.45s

ERRORS:
ModuleNotFoundError: No module named 'solution'

OUTPUT:
Traceback (most recent call last):
...
```

## 💡 Best Practices

1. **Always fetch limits from database** (organizer sets them)
2. **Validate paths** before passing to function
3. **Log all runs** for auditing
4. **Handle timeouts** gracefully
5. **Clean old results** regularly
6. **Tester should print only the number** (score) to stdout
7. **Additional information** save to files in `/output`
8. **Save `score` and `scoreComment`** in database for each submission

## 📞 Errors and Solutions

### "Failed to start Docker"

- Check if Docker is running: `docker ps`
- Check user permissions

### "Timeout"

- Organizer can increase timeout in database
- Or optimize tester

### "Permission denied"

- Check folder permissions: `ls -la /var/tasks`
- Ensure user 1000:1000 has access

## 🕐 How Timeout Works

Runner.ts implements two-stage process killing:

1. **After timeout expires** (e.g., 300s):
   - Sets `timedOut = true` flag
   - Sends `SIGTERM` to Docker process (graceful shutdown)
   - Sets additional 5-second timer

2. **After 5 seconds** (if process still running):
   - Sends `SIGKILL` to process (forced kill)

3. **When process ends normally** (before timeout):
   - `clearTimeout()` cancels timer
   - Returns normal result with `timedOut = false`

**Example:**

- Timeout set: 300s
- Process ends after 350s
- After 300s: `SIGTERM` sent, `timedOut = true`
- Process ends within 5s
- Result: `success = false`, `timedOut = true`, `score = null`

---

**That's it!** One simple TypeScript file for running Docker with organizer-defined parameters 🚀
