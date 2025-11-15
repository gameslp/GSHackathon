'use client';

import { useEffect, useState } from 'react';
import type { HackathonResource } from '@/types';

interface DatasetDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: HackathonResource[];
  challengeTitle: string;
}

export default function DatasetDownloadModal({
  isOpen,
  onClose,
  resources,
  challengeTitle,
}: DatasetDownloadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set(resources.map((resource) => resource.id)));
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileSizes, setFileSizes] = useState<Record<number, number | null>>({});
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    setSelectedFiles(new Set(resources.map((resource) => resource.id)));
  }, [resources]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const toBytes = (length: string | null) => {
      if (!length) return null;
      const parsed = Number(length);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const fetchSizes = async () => {
      const entries = await Promise.all(
        resources.map(async (resource) => {
          const downloadUrl = resource.url.startsWith('http')
            ? resource.url
            : `${API_BASE_URL}${resource.url}`;

          try {
            const response = await fetch(downloadUrl, {
              method: 'HEAD',
              credentials: 'include',
            });
            const bytes = toBytes(response.headers.get('content-length'));
            return [resource.id, bytes] as const;
          } catch (error) {
            console.warn('Unable to determine size for resource', resource.id, error);
            return [resource.id, null] as const;
          }
        })
      );

      if (!cancelled) {
        setFileSizes(Object.fromEntries(entries));
      }
    };

    void fetchSizes();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL, isOpen, resources]);

  if (!isOpen) return null;

  const toggleFile = (id: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAll = () => {
    if (selectedFiles.size === resources.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(resources.map(r => r.id)));
    }
  };

  const formatBytes = (bytes?: number | null) => {
    if (bytes == null) return 'Unknown';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
  };

  const getTotalSize = (): string => {
    const totalBytes = resources.reduce((sum, resource) => {
      if (!selectedFiles.has(resource.id)) {
        return sum;
      }
      const size = fileSizes[resource.id];
      return typeof size === 'number' ? sum + size : sum;
    }, 0);

    if (totalBytes === 0) {
      const hasUnknown = resources.some(
        (resource) => selectedFiles.has(resource.id) && fileSizes[resource.id] == null
      );
      return hasUnknown ? 'Unknown' : '0 B';
    }

    return formatBytes(totalBytes);
  };

  const handleDownload = async () => {
    if (selectedFiles.size === 0) {
      alert('Wybierz przynajmniej jeden plik');
      return;
    }

    setIsDownloading(true);

    // Simulate download with progress
    const selectedResources = resources.filter(r => selectedFiles.has(r.id));
    
    try {
      // In real app, this would be actual file downloads
      for (const resource of selectedResources) {
        const downloadUrl = resource.url.startsWith('http')
          ? resource.url
          : `${API_BASE_URL}/uploads${resource.url}`;

        const response = await fetch(downloadUrl, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to download ${resource.title}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName =
          resource.title.replace(/[\\/:*?"<>|]/g, '_') || `resource-${resource.id}`;
        link.href = objectUrl;
        link.download = safeName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      }

      alert(`Pobrano ${selectedFiles.size} plików!`);
      onClose();
    } catch (error) {
      console.error('Download error:', error);
      alert('Wystąpił błąd podczas pobierania plików');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">Pobierz Dataset</h2>
              <p className="text-sm text-gray-600">{challengeTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              {selectedFiles.size === resources.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedFiles.size} z {resources.length} wybranych
            </span>
          </div>

          <div className="space-y-2">
            {resources.map((resource) => {
              const isSelected = selectedFiles.has(resource.id);
              const trackedSize = fileSizes[resource.id];
              const fileSizeLabel =
                trackedSize === undefined ? 'Loading…' : formatBytes(trackedSize);

              return (
                <label
                  key={resource.id}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFile(resource.id)}
                    className="w-5 h-5 text-primary focus:ring-primary rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {resource.title}
                      </span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {fileSizeLabel}
                      </span>
                    </div>
                    {resource.title.includes('train') && (
                      <p className="text-xs text-gray-500 mt-1">Dane treningowe</p>
                    )}
                    {resource.title.includes('test') && (
                      <p className="text-xs text-gray-500 mt-1">Dane testowe</p>
                    )}
                    {resource.title.includes('submission') && (
                      <p className="text-xs text-gray-500 mt-1">Przykładowy format zgłoszenia</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {resources.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Brak dostępnych plików do pobrania</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Łączny rozmiar: <span className="font-semibold text-gray-900">{getTotalSize()}</span>
            </div>
            {selectedFiles.size > 0 && (
              <div className="text-xs text-gray-500">
                Pobieranie może potrwać kilka minut
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDownloading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anuluj
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading || selectedFiles.size === 0}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? 'Pobieranie...' : `Pobierz (${selectedFiles.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
