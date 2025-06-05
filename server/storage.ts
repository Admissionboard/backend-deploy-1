import {
  users,
  universities,
  courses,
  counselors,
  favorites,
  applications,
  notifications,
  tutorials,
  adminUsers,
  type User,
  type UpsertUser,
  type University,
  type InsertUniversity,
  type Course,
  type InsertCourse,
  type CourseWithUniversity,
  type Counselor,
  type InsertCounselor,
  type Favorite,
  type InsertFavorite,
  type FavoriteWithCourse,
  type Application,
  type InsertApplication,
  type Notification,
  type InsertNotification,
  type Tutorial,
  type InsertTutorial,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, inArray, gte, asc, distinct } from "drizzle-orm"; // ✅ FIXED import location

export interface IStorage {
  // (interface unchanged)
  // ...
}

export class DatabaseStorage implements IStorage {
  // ✅ Your methods start here (unchanged) ...

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // ⚙️ All other methods remain as you had them, no changes

  // ✅ These were previously below a bad import. Now they're correct:

  async getDistinctFaculties(): Promise<string[]> {
    const result = await db
      .selectDistinct({ faculty: courses.faculty })
      .from(courses)
      .where(eq(courses.faculty, courses.faculty))
      .orderBy(asc(courses.faculty));
    return result.map(r => r.faculty).filter(Boolean);
  }

  async getDistinctLevels(): Promise<string[]> {
    const result = await db
      .selectDistinct({ level: courses.level })
      .from(courses)
      .where(eq(courses.level, courses.level))
      .orderBy(asc(courses.level));
    return result.map(r => r.level).filter(Boolean);
  }

  async getDistinctIeltsScores(): Promise<string[]> {
    const result = await db
      .selectDistinct({ ieltsOverall: courses.ieltsOverall })
      .from(courses)
      .where(eq(courses.ieltsOverall, courses.ieltsOverall))
      .orderBy(asc(courses.ieltsOverall));
    return result.map(r => r.ieltsOverall?.toString()).filter(Boolean);
  }

  // ✅ The rest of your methods follow as before (no changes)
}

export const storage = new DatabaseStorage();