# Dockerfile dla środowiska testowania rozwiązań ML/AI
FROM python:3.11-slim

# Metadane
LABEL maintainer="GSHackathon"
LABEL description="Python ML/AI testing environment"

# Zmienne środowiskowe
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalacja zależności systemowych
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

# Instalacja podstawowych bibliotek ML/AI
RUN pip install --no-cache-dir \
    # Obliczenia i dane
    numpy==1.26.3 \
    pandas==2.1.4
    scipy==1.11.4 \
    # # Machine Learning
    scikit-learn==1.4.0 \
    # xgboost==2.0.3 \
    # # Deep Learning - TensorFlow
    # tensorflow==2.15.0 \
    # # Deep Learning - PyTorch
    # torch==2.1.2 \
    # torchvision==0.16.2 \
    # # NLP
    # transformers==4.36.2 \
    # # Computer Vision
    # opencv-python==4.9.0.80 \
    # pillow==10.2.0 \
    # # Wizualizacja
    # matplotlib==3.8.2 \
    # # Narzędzia
    # jupyter==1.0.0

# Utworzenie użytkownika non-root
RUN groupadd -g 1000 runner && \
    useradd -m -u 1000 -g runner runner

# Utworzenie katalogów roboczych
RUN mkdir -p /problem /submission /output && \
    chown -R runner:runner /output

# Katalog roboczy
WORKDIR /workspace

# Przełączenie na użytkownika non-root
USER runner

# Domyślna komenda (będzie nadpisana przez docker run)
CMD ["/bin/bash"]
