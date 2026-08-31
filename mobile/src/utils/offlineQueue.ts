/**
 * Kinetra Mobile Offline Set Queue
 * Queues completed exercise set summaries locally when network is unavailable.
 */

import { PoseAnalysisResult } from '../engine/pose/types';
import { apiClient } from '../api/client';

export interface QueuedSetSummary {
  id: string;
  workoutId?: string;
  sessionId?: string;
  exerciseId: string;
  exerciseName: string;
  reps: number;
  formScore: number;
  repScores: number[];
  flags: string[];
  durationMs: number;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

class OfflineSetQueue {
  private queue: QueuedSetSummary[] = [];

  public enqueueSet(
    result: PoseAnalysisResult,
    options: {
      workoutId?: string;
      sessionId?: string;
      exerciseName: string;
      durationMs?: number;
    }
  ): QueuedSetSummary {
    const item: QueuedSetSummary = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workoutId: options.workoutId,
      sessionId: options.sessionId,
      exerciseId: result.exercise_id,
      exerciseName: options.exerciseName,
      reps: result.rep_count,
      formScore: result.average_form_score,
      repScores: result.rep_scores,
      flags: result.flags.map((f) => f.description),
      durationMs: options.durationMs || result.duration_ms || 0,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this.queue.push(item);
    return item;
  }

  public getPendingSets(): QueuedSetSummary[] {
    return this.queue.filter((s) => s.status === 'pending');
  }

  public getAllSets(): QueuedSetSummary[] {
    return [...this.queue];
  }

  public async syncPendingSets(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    const pending = this.getPendingSets();
    for (const item of pending) {
      try {
        if (item.sessionId) {
          await apiClient.logSessionExercise(item.sessionId, {
            exercise_id: item.exerciseId,
            sets: 1,
            reps: item.reps,
            duration_seconds: Math.round(item.durationMs / 1000),
          });
        }
        item.status = 'synced';
        synced++;
      } catch {
        item.status = 'failed';
        failed++;
      }
    }

    return { synced, failed };
  }

  public clearQueue(): void {
    this.queue = [];
  }
}

export const offlineSetQueue = new OfflineSetQueue();
