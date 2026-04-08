/**
 * Activity Logger Service
 * Automatically logs all user activities to database
 * Replaces localStorage-based activity logging
 */

import { createActivityLog } from './db';
import { InsertActivityLog } from '../drizzle/schema';

export type ActivityType = 'transaction' | 'installment' | 'saving' | 'budget' | 'backup';
export type ActivityAction = 'create' | 'update' | 'delete' | 'restore';

export interface ActivityLogInput {
  userId: number;
  type: ActivityType;
  action: ActivityAction;
  description: string;
  details?: Record<string, any>;
}

/**
 * Log activity to database
 * This is the main function to use throughout the application
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    const logData: InsertActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: input.userId,
      type: input.type,
      action: input.action,
      description: input.description,
    };

    await createActivityLog(logData);
    console.log(`[Activity Log] ${input.type}.${input.action}: ${input.description}`);
  } catch (error) {
    console.error('[Activity Log] Failed to log activity:', error);
    // Don't throw - activity logging should not break the main operation
  }
}

/**
 * Log transaction activity
 */
export async function logTransactionActivity(
  userId: number,
  action: 'create' | 'update' | 'delete',
  description: string,
  details?: Record<string, any>
): Promise<void> {
  return logActivity({
    userId,
    type: 'transaction',
    action,
    description,
    details,
  });
}

/**
 * Log installment activity
 */
export async function logInstallmentActivity(
  userId: number,
  action: 'create' | 'update' | 'delete',
  description: string,
  details?: Record<string, any>
): Promise<void> {
  return logActivity({
    userId,
    type: 'installment',
    action,
    description,
    details,
  });
}

/**
 * Log saving activity
 */
export async function logSavingActivity(
  userId: number,
  action: 'create' | 'update' | 'delete',
  description: string,
  details?: Record<string, any>
): Promise<void> {
  return logActivity({
    userId,
    type: 'saving',
    action,
    description,
    details,
  });
}

/**
 * Log budget activity
 */
export async function logBudgetActivity(
  userId: number,
  action: 'create' | 'update' | 'delete',
  description: string,
  details?: Record<string, any>
): Promise<void> {
  return logActivity({
    userId,
    type: 'budget',
    action,
    description,
    details,
  });
}

/**
 * Log backup activity
 */
export async function logBackupActivity(
  userId: number,
  action: 'create' | 'restore',
  description: string,
  details?: Record<string, any>
): Promise<void> {
  return logActivity({
    userId,
    type: 'backup',
    action,
    description,
    details,
  });
}

/**
 * Batch log multiple activities
 */
export async function logActivitiesBatch(activities: ActivityLogInput[]): Promise<void> {
  try {
    const promises = activities.map(activity => logActivity(activity));
    await Promise.all(promises);
    console.log(`[Activity Log] Logged ${activities.length} activities in batch`);
  } catch (error) {
    console.error('[Activity Log] Failed to batch log activities:', error);
  }
}
