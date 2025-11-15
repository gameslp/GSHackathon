# Docker Runner - Uruchamianie testerek ML/AI

## 📋 Opis

Prosty moduł TypeScript do uruchamiania Dockera z testerkami. Organizator ustawia ograniczenia zasobów (CPU, RAM, timeout) dla każdego zadania.

## 📁 Struktura

```
src/docker/
├── runner.ts       # Główny plik - funkcja runDockerTest()
├── examples.ts     # Przykłady użycia
└── README.md       # Ta dokumentacja
```

## 🚀 Użycie

### Import

```typescript
import { runDockerTest } from "./docker/runner";
```

### Podstawowy przykład

```typescript
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_123", // Folder użytkownika
	organizerFilesDir: "/var/tasks/task_001", // Folder organizatora (z testerką)
	outputDir: "/var/results/user_123", // Folder na wyniki

	// OGRANICZENIA OD ORGANIZATORA
	cpuLimit: 2, // 2 rdzenie CPU
	memoryLimit: "4g", // 4GB RAM
	timeout: 300, // 5 minut
});

console.log("Sukces:", result.success);
console.log("Score:", result.score); // null lub liczba (np. 85.5)
console.log("Komentarz:", result.scoreComment); // Pełny output
console.log("Czas:", result.executionTime, "s");
```

## 🎯 Parametry konfiguracji (od organizatora)

```typescript
interface DockerRunConfig {
	// ŚCIEŻKI (wymagane)
	userSolutionDir: string; // Folder z plikami użytkownika
	organizerFilesDir: string; // Folder z testerką i danymi testowymi
	outputDir: string; // Folder na wyniki

	// OGRANICZENIA (wymagane - USTAWIA ORGANIZATOR)
	cpuLimit: number; // Liczba rdzeni CPU (np. 1, 2, 4, 8)
	memoryLimit: string; // Limit RAM (np. '512m', '1g', '4g', '16g')
	timeout: number; // Timeout w sekundach (np. 30, 300, 1800)

	// OPCJONALNE
	testerFileName?: string; // Nazwa testerki (domyślnie: 'tester.py')
	imageName?: string; // Obraz Docker (domyślnie: 'ml-sandbox')
	containerName?: string; // Nazwa kontenera (domyślnie: generowana)
}
```

## 📊 Wynik

```typescript
interface DockerRunResult {
	success: boolean; // Czy test zakończył się sukcesem (exitCode === 0)
	exitCode: number; // Kod wyjścia procesu
	error?: string; // Stderr jeśli wystąpił
	timedOut: boolean; // Czy przekroczono timeout
	executionTime: number; // Czas wykonania w sekundach

	// Pola gotowe do zapisu w Submission
	score: number | null; // Wynik sparsowany z outputu (null jeśli błąd)
	scoreComment: string; // Sformatowany komentarz z pełnym outputem
}
```

**UWAGA**: Program organizatora (testerka) powinien po prostu wypisać liczbę (score), np. `"85.5"` lub `"100"`. Ta liczba zostanie sparsowana i zapisana w polu `score`. Cały output wraz z dodatkową informacją trafia do pola `scoreComment`.

## 🔒 Bezpieczeństwo (automatyczne)

Wszystkie te zabezpieczenia są **zawsze aktywne**:

- ✅ `--network=none` - Brak dostępu do internetu
- ✅ `--read-only` - System plików tylko do odczytu
- ✅ `--user 1000:1000` - Użytkownik non-root
- ✅ `--cap-drop=ALL` - Brak capabilities
- ✅ `--security-opt=no-new-privileges` - Brak eskalacji uprawnień
- ✅ Mounty read-only dla folderów użytkownika i organizatora
- ✅ Mount read-write tylko dla outputDir

## 📝 Przykłady różnych limitów

### Proste zadanie (algorytm sortowania)

```typescript
// Organizator ustawia małe limity dla prostego zadania
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_123",
	organizerFilesDir: "/var/tasks/sorting",
	outputDir: "/var/results/user_123",
	cpuLimit: 1, // 1 rdzeń
	memoryLimit: "512m", // 512MB
	timeout: 30, // 30 sekund
});
```

### Zadanie Machine Learning

```typescript
// Organizator ustawia średnie limity
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_456",
	organizerFilesDir: "/var/tasks/ml_classification",
	outputDir: "/var/results/user_456",
	cpuLimit: 4, // 4 rdzenie
	memoryLimit: "8g", // 8GB
	timeout: 600, // 10 minut
});
```

### Zadanie Deep Learning

```typescript
// Organizator ustawia duże limity dla ciężkiego zadania
const result = await runDockerTest({
	userSolutionDir: "/var/submissions/user_789",
	organizerFilesDir: "/var/tasks/deep_learning",
	outputDir: "/var/results/user_789",
	cpuLimit: 8, // 8 rdzeni
	memoryLimit: "16g", // 16GB
	timeout: 1800, // 30 minut
});
```

## 🎓 Integracja z backendem

### W kontrolerze

```typescript
import { runDockerTest } from "../docker/runner";
import { prisma } from "@prisma";

async function submitSolution(req: Request, res: Response) {
	const { taskId, userId } = req.body;

	// 1. Pobierz limity ustawione przez organizatora z bazy danych
	const task = await prisma.task.findUnique({
		where: { id: taskId },
		select: {
			cpuLimit: true,
			memoryLimit: true,
			timeout: true,
		},
	});

	// 2. Uruchom test z limitami od organizatora
	const result = await runDockerTest({
		userSolutionDir: `/var/submissions/${userId}`,
		organizerFilesDir: `/var/tasks/${taskId}`,
		outputDir: `/var/results/${userId}_${taskId}`,
		cpuLimit: task.cpuLimit, // Z bazy danych
		memoryLimit: task.memoryLimit, // Z bazy danych
		timeout: task.timeout, // Z bazy danych
	});

	// 3. Zapisz wynik
	await prisma.submission.create({
		data: {
			userId,
			taskId,
			score: result.score, // Float | null
			scoreComment: result.scoreComment, // String z pełnym outputem
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

## 🗄️ Schemat bazy danych (przykład)

Organizator ustawia limity przy tworzeniu zadania:

```prisma
model Task {
  id            String   @id @default(uuid())
  name          String
  description   String

  // LIMITY USTAWIANE PRZEZ ORGANIZATORA
  cpuLimit      Int      @default(2)        // Liczba rdzeni
  memoryLimit   String   @default("4g")     // Limit RAM
  timeout       Int      @default(300)      // Timeout w sekundach

  createdAt     DateTime @default(now())
  organizerId   String
  organizer     User     @relation(fields: [organizerId], references: [id])
  submissions   Submission[]
}
```

## 🔧 Format testerki (w folderze organizatora)

Testerka to plik Python w `organizerFilesDir/tester.py`:

**WAŻNE**: Testerka powinna po prostu wypisać liczbę (score) na stdout. Ta liczba zostanie automatycznie sparsowana.

```python
import sys
import json

def main():
    submission_dir = sys.argv[1]  # /submission
    output_dir = sys.argv[2]      # /output

    # Załaduj rozwiązanie użytkownika
    sys.path.insert(0, submission_dir)
    from solution import solve

    # Wykonaj testy i oblicz score
    score = evaluate_solution(solve)

    # WYPISZ SCORE NA STDOUT (to zostanie sparsowane)
    print(score)  # np. "85.5" lub "100"

    # Opcjonalnie: zapisz szczegóły do /output/result.json
    with open(f'{output_dir}/result.json', 'w') as f:
        json.dump({
            "score": score,
            "details": "All tests passed"
        }, f)

    sys.exit(0)

def evaluate_solution(solve_fn):
    # Twoja logika testów
    # ...
    return 85.5  # Przykładowy wynik

if __name__ == "__main__":
    main()
```

**Przykład prostszej testerki:**

```python
#!/usr/bin/env python3
import sys

# Załaduj rozwiązanie użytkownika
sys.path.insert(0, sys.argv[1])
from solution import solve

# Testy
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

# Wypisz score (procent poprawnych)
score = (correct / len(test_cases)) * 100
print(score)  # np. "100" lub "66.66666666666667"
```

## 📂 Struktura folderów

```
/var/tasks/task_001/              # Folder organizatora
├── tester.py                     # Testerka (WYMAGANE)
├── test_data.csv                 # Dane testowe (opcjonalne)
└── expected_output.txt           # Oczekiwane wyniki (opcjonalne)

/var/submissions/user_123/        # Folder użytkownika
└── solution.py                   # Rozwiązanie użytkownika

/var/results/user_123/            # Folder wyjściowy
├── result.json                   # Wynik z testerki
└── output.log                    # Logi (opcjonalne)
```

## ⚙️ Wymagania

1. **Docker zainstalowany i uruchomiony**

   ```bash
   docker --version
   ```

2. **Obraz ml-sandbox zbudowany**

   ```bash
   docker build -f Dockerfile.ai -t ml-sandbox .
   ```

3. **Katalogi utworzone z odpowiednimi uprawnieniami**
   ```bash
   mkdir -p /var/tasks /var/submissions /var/results
   chown -R 1000:1000 /var/tasks /var/submissions /var/results
   ```

## 🐛 Obsługa błędów

```typescript
const result = await runDockerTest({...});

if (result.timedOut) {
  console.log('Przekroczono timeout!');
  console.log('Score:', null);
  console.log('Komentarz:', result.scoreComment);
} else if (!result.success) {
  console.log('Test zakończony błędem:', result.error);
  console.log('Score:', result.score);  // Prawdopodobnie null
} else {
  console.log('Test OK!');
  console.log('Score:', result.score);  // np. 85.5
  console.log('Czas:', result.executionTime, 's');
}
```

### Przykładowe wartości `scoreComment`:

**Sukces:**

```
Status: SUKCES
Exit code: 0
Czas wykonania: 2.34s

OUTPUT:
85.5
```

**Timeout:**

```
Status: BŁĄD
Exit code: 124
Czas wykonania: 300.00s
⚠️ PRZEKROCZONO LIMIT CZASU

BŁĘDY:
Test przekroczył limit czasu 300s
```

**Błąd:**

```
Status: BŁĄD
Exit code: 1
Czas wykonania: 0.45s

BŁĘDY:
ModuleNotFoundError: No module named 'solution'

OUTPUT:
Traceback (most recent call last):
...
```

## 💡 Najlepsze praktyki

1. **Zawsze pobieraj limity z bazy danych** (organizator je ustawia)
2. **Waliduj ścieżki** przed przekazaniem do funkcji
3. **Loguj wszystkie uruchomienia** dla audytu
4. **Obsługuj timeouty** gracefully
5. **Czyść stare wyniki** regularnie
6. **Testerka powinna wypisać tylko liczbę** (score) na stdout
7. **Dodatkowe informacje** zapisuj do plików w `/output`
8. **Zapisuj `score` i `scoreComment`** w bazie danych dla każdego submission

## 📞 Błędy i rozwiązania

### "Failed to start Docker"

- Sprawdź czy Docker działa: `docker ps`
- Sprawdź uprawnienia użytkownika

### "Timeout"

- Organizator może zwiększyć timeout w bazie danych
- Lub zoptymalizować testerę

### "Permission denied"

- Sprawdź uprawnienia folderów: `ls -la /var/tasks`
- Upewnij się że user 1000:1000 ma dostęp

## 🕐 Jak działa timeout?

Runner.ts implementuje dwuetapowe zabijanie procesu:

1. **Po upływie timeout** (np. 300s):
   - Ustawia flagę `timedOut = true`
   - Wysyła `SIGTERM` do procesu Docker (grzeczne zamknięcie)
   - Ustawia dodatkowy timer na 5 sekund

2. **Po 5 sekundach** (jeśli proces wciąż działa):
   - Wysyła `SIGKILL` do procesu (siłowe zabicie)

3. **Gdy proces się kończy normalnie** (przed timeoutem):
   - `clearTimeout()` anuluje timer
   - Zwraca normalny wynik z `timedOut = false`

**Przykład:**

- Timeout ustawiony: 300s
- Proces kończy się po 350s
- Po 300s: wysłany `SIGTERM`, `timedOut = true`
- Proces się kończy w ciągu 5s
- Wynik: `success = false`, `timedOut = true`, `score = null`

---

**To wszystko!** Jeden prosty plik TypeScript do uruchamiania Dockera z parametrami od organizatora 🚀
