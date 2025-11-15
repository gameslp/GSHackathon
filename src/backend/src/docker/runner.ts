import { spawn } from "child_process";

/**
 * Interfejs dla konfiguracji uruchomienia Dockera
 * Organizator ustawia te parametry dla każdego zadania
 */
export interface DockerRunConfig {
	// Ścieżki do folderów
	userSolutionDir: string; // Folder z plikami użytkownika
	organizerFilesDir: string; // Folder z plikami organizatora (zawiera testerę)
	outputDir: string; // Folder na wyniki

	// Ograniczenia zasobów (ustawiane przez organizatora)
	cpuLimit: number; // Liczba rdzeni CPU (np. 2)
	memoryLimit: string; // Limit pamięci RAM (np. '4g', '2g', '512m')
	timeout: number; // Timeout w sekundach (np. 300)

	// Opcjonalne
	testerFileName?: string; // Nazwa pliku testerki (domyślnie: tester.py)
	imageName?: string; // Nazwa obrazu Docker (domyślnie: ml-sandbox)
	containerName?: string; // Nazwa kontenera (domyślnie: generowana)
}

/**
 * Interfejs wyniku uruchomienia
 * Kompatybilny z modelem Submission (score, scoreComment)
 */
export interface DockerRunResult {
	success: boolean; // Czy test zakończył się sukcesem
	exitCode: number; // Kod wyjścia
	error?: string; // Błędy jeśli wystąpiły
	timedOut: boolean; // Czy przekroczono timeout
	executionTime: number; // Czas wykonania w sekundach

	// Pola gotowe do zapisu w Submission
	score: number | null; // Wynik sparsowany z outputu (null jeśli błąd)
	scoreComment: string; // Sformatowany komentarz z pełnym outputem
}

/**
 * Parsuje score z outputu testera
 * Zakłada że tester zwraca po prostu liczbę (np. "85.5" lub "100")
 */
function parseScoreFromOutput(output: string): number | null {
	// Usuń białe znaki i spróbuj sparsować jako liczbę
	const trimmed = output.trim();
	const score = parseFloat(trimmed);

	// Zwróć score tylko jeśli to prawidłowa liczba
	return isNaN(score) ? 0 : score;
}

/**
 * Formatuje komentarz dla Submission
 */
function formatScoreComment(result: {
	success: boolean;
	exitCode: number;
	output: string;
	error?: string;
	timedOut: boolean;
	executionTime: number;
}): string {
	const lines: string[] = [];

	lines.push(`Status: ${result.success ? "SUKCES" : "BŁĄD"}`);
	lines.push(`Exit code: ${result.exitCode}`);
	lines.push(`Czas wykonania: ${result.executionTime.toFixed(2)}s`);

	if (result.timedOut) {
		lines.push("⚠️ PRZEKROCZONO LIMIT CZASU");
	}

	if (result.error) {
		lines.push(`\nBŁĘDY:\n${result.error}`);
	}

	if (result.output) {
		lines.push(`\nOUTPUT:\n${result.output}`);
	}

	return lines.join("\n");
}

/**
 * Uruchamia Docker z testerką w bezpiecznym środowisku
 *
 * @param config - Konfiguracja uruchomienia (ograniczenia od organizatora)
 * @returns Promise z wynikiem uruchomienia
 *
 * @example
 * ```typescript
 * const result = await runDockerTest({
 *   userSolutionDir: '/path/to/user/files',
 *   organizerFilesDir: '/path/to/organizer/files',
 *   outputDir: '/path/to/output',
 *   cpuLimit: 2,
 *   memoryLimit: '4g',
 *   timeout: 300
 * });
 *
 * console.log('Success:', result.success);
 * console.log('Output:', result.output);
 * ```
 */
export async function runDockerTest(
	config: DockerRunConfig
): Promise<DockerRunResult> {
	const startTime = Date.now();

	const {
		userSolutionDir,
		organizerFilesDir,
		outputDir,
		cpuLimit,
		memoryLimit,
		timeout,
		testerFileName = "tester.py",
		imageName = "ml-sandbox",
		containerName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
	} = config;

	// Budowanie argumentów dla docker run
	const dockerArgs = [
		"run",
		"--rm", // Usuń kontener po zakończeniu
		"--name",
		containerName, // Nazwa kontenera

		// OGRANICZENIA ZASOBÓW (od organizatora)
		"--cpus",
		cpuLimit.toString(), // Limit CPU
		"--memory",
		memoryLimit, // Limit RAM
		"--memory-swap",
		memoryLimit, // Brak dodatkowego swap
		"--pids-limit",
		"256", // Limit procesów

		// BEZPIECZEŃSTWO
		"--network",
		"none", // Brak dostępu do internetu
		"--read-only", // System plików tylko do odczytu
		"--tmpfs",
		"/tmp:rw,noexec,nosuid,size=512m", // Tymczasowy /tmp w RAM
		"--security-opt",
		"no-new-privileges", // Brak eskalacji uprawnień
		"--cap-drop",
		"ALL", // Usuń wszystkie capabilities
		"--user",
		"1000:1000", // Użytkownik non-root

		// MONTOWANIE FOLDERÓW
		"-v",
		`${organizerFilesDir}:/problem:ro`, // Folder organizatora (read-only)
		"-v",
		`${userSolutionDir}:/submission:ro`, // Folder użytkownika (read-only)
		"-v",
		`${outputDir}:/output:rw`, // Folder wyjściowy (read-write)

		// OBRAZ I KOMENDA
		imageName,
		"python",
		`/problem/${testerFileName}`,
		"/submission",
		"/output",
	];

	return new Promise(resolve => {
		let stdout = "";
		let stderr = "";
		let timedOut = false;

		// Uruchom Docker
		const dockerProcess = spawn("docker", dockerArgs);

		// Timeout handler
		const timeoutHandle = setTimeout(() => {
			timedOut = true;
			dockerProcess.kill("SIGTERM");

			// Force kill po 5 sekundach
			setTimeout(() => {
				if (!dockerProcess.killed) {
					dockerProcess.kill("SIGKILL");
				}
			}, 5000);
		}, timeout * 1000);

		// Zbieranie output
		dockerProcess.stdout?.on("data", data => {
			stdout += data.toString();
		});

		dockerProcess.stderr?.on("data", data => {
			stderr += data.toString();
		});

		// Obsługa błędów procesu
		dockerProcess.on("error", error => {
			clearTimeout(timeoutHandle);
			const executionTime = (Date.now() - startTime) / 1000;

			const baseResult = {
				success: false,
				exitCode: -1,
				output: stdout,
				error: `Failed to start Docker: ${error.message}`,
				timedOut: false,
				executionTime,
			};

			resolve({
				success: baseResult.success,
				exitCode: baseResult.exitCode,
				error: baseResult.error,
				timedOut: baseResult.timedOut,
				executionTime: baseResult.executionTime,
				score: null,
				scoreComment: formatScoreComment(baseResult),
			});
		});

		// Zakończenie procesu
		dockerProcess.on("close", code => {
			clearTimeout(timeoutHandle);
			const executionTime = (Date.now() - startTime) / 1000;

			if (timedOut) {
				const baseResult = {
					success: false,
					exitCode: 124,
					output: stdout,
					error: `Test przekroczył limit czasu ${timeout}s`,
					timedOut: true,
					executionTime,
				};

				resolve({
					success: baseResult.success,
					exitCode: baseResult.exitCode,
					error: baseResult.error,
					timedOut: baseResult.timedOut,
					executionTime: baseResult.executionTime,
					score: null,
					scoreComment: formatScoreComment(baseResult),
				});
			} else {
				const baseResult = {
					success: code === 0,
					exitCode: code ?? -1,
					output: stdout,
					error: stderr || undefined,
					timedOut: false,
					executionTime,
				};

				resolve({
					success: baseResult.success,
					exitCode: baseResult.exitCode,
					error: baseResult.error,
					timedOut: baseResult.timedOut,
					executionTime: baseResult.executionTime,
					score: parseScoreFromOutput(stdout),
					scoreComment: formatScoreComment(baseResult),
				});
			}
		});
	});
}
