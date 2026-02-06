import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Goal, GoalCategory, GoalFormData, GoalIconType } from '../types';

const DEFAULT_SHARED_PATH = 'shared/goals-app';
export const DEFAULT_GOALS_TITLE = 'Мои цели';

const sharedPath = process.env.NEXT_PUBLIC_FIREBASE_SHARED_PATH ?? DEFAULT_SHARED_PATH;
const sharedPathSegments = sharedPath.split('/').filter(Boolean);

if (sharedPathSegments.length < 2 || sharedPathSegments.length % 2 !== 0) {
  throw new Error(
    'NEXT_PUBLIC_FIREBASE_SHARED_PATH must point to a document path (e.g. "shared/goals-app").'
  );
}

const [sharedRootSegment, ...sharedRestSegments] = sharedPathSegments;
const sharedDocRef = doc(db, sharedRootSegment, ...sharedRestSegments);
const goalsCollectionRef = collection(sharedDocRef, 'goals');

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function mapGoal(data: Record<string, unknown>, id: string): Goal {
  const now = new Date();
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : '',
    icon: (data.icon as GoalIconType) ?? 'book',
    currentValue: toNumber(data.currentValue, 0),
    targetValue: Math.max(1, toNumber(data.targetValue, 1)),
    unit: typeof data.unit === 'string' ? data.unit : '',
    category: (data.category as GoalCategory) ?? 'custom',
    color: typeof data.color === 'string' ? data.color : 'emerald',
    incrementAmount: Math.max(1, toNumber(data.incrementAmount, 1)),
    periodStart: toDate(data.periodStart, now),
    periodEnd: toDate(data.periodEnd, now),
    lastResetAt: toDate(data.lastResetAt, now),
    createdAt: toDate(data.createdAt, now),
    updatedAt: toDate(data.updatedAt, now),
  };
}

function mapGoalFormData(formData: GoalFormData) {
  return {
    title: formData.title,
    subtitle: formData.subtitle,
    icon: formData.icon,
    targetValue: formData.targetValue,
    unit: formData.unit,
    category: formData.category,
    color: formData.color,
    incrementAmount: formData.incrementAmount,
    periodStart: Timestamp.fromDate(formData.periodStart),
    periodEnd: Timestamp.fromDate(formData.periodEnd),
  };
}

export function subscribeGoals(
  onGoals: (goals: Goal[]) => void,
  onError: (error: Error) => void
): () => void {
  const goalsQuery = query(goalsCollectionRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    goalsQuery,
    (snapshot) => {
      const nextGoals = snapshot.docs.map((snapshotDoc) =>
        mapGoal(snapshotDoc.data(), snapshotDoc.id)
      );
      onGoals(nextGoals);
    },
    (error) => onError(error)
  );
}

export function subscribeGoalsTitle(
  onTitle: (title: string) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    sharedDocRef,
    (snapshot) => {
      const data = snapshot.data();
      const title =
        typeof data?.title === 'string' && data.title.trim().length > 0
          ? data.title.trim()
          : DEFAULT_GOALS_TITLE;

      onTitle(title);
    },
    (error) => onError(error)
  );
}

export async function addGoalToFirestore(formData: GoalFormData): Promise<void> {
  const now = Timestamp.now();
  await addDoc(goalsCollectionRef, {
    ...mapGoalFormData(formData),
    currentValue: 0,
    lastResetAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateGoalInFirestore(id: string, formData: GoalFormData): Promise<void> {
  const goalDocRef = doc(goalsCollectionRef, id);

  await updateDoc(goalDocRef, {
    ...mapGoalFormData(formData),
    updatedAt: Timestamp.now(),
  });
}

export async function updateGoalProgressInFirestore(id: string, value: number): Promise<void> {
  const goalDocRef = doc(goalsCollectionRef, id);
  await updateDoc(goalDocRef, {
    currentValue: value,
    updatedAt: Timestamp.now(),
  });
}

export async function incrementGoalInFirestore(
  id: string,
  amount: number,
  currentValue: number,
  targetValue: number
): Promise<void> {
  const goalDocRef = doc(goalsCollectionRef, id);
  const nextValue = Math.min(currentValue + amount, targetValue);

  await updateDoc(goalDocRef, {
    currentValue: nextValue,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteGoalFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(goalsCollectionRef, id));
}

export async function updateGoalsTitleInFirestore(title: string): Promise<void> {
  await setDoc(
    sharedDocRef,
    {
      title,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

interface GoalResetUpdate {
  id: string;
  periodStart: Date;
  periodEnd: Date;
}

export async function resetGoalsPeriodInFirestore(updates: GoalResetUpdate[]): Promise<void> {
  if (updates.length === 0) {
    return;
  }

  const now = Timestamp.now();
  const batch = writeBatch(db);

  updates.forEach((update) => {
    batch.update(doc(goalsCollectionRef, update.id), {
      currentValue: 0,
      periodStart: Timestamp.fromDate(update.periodStart),
      periodEnd: Timestamp.fromDate(update.periodEnd),
      lastResetAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
}
