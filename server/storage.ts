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
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // University operations
  getUniversities(): Promise<University[]>;
  createUniversity(university: InsertUniversity): Promise<University>;

  // Course operations
  getCourses(filters?: { search?: string; faculty?: string; level?: string; ieltsScore?: string }): Promise<CourseWithUniversity[]>;
  getCoursesPaginated(
    filters: { search?: string; faculty?: string; level?: string; ieltsScore?: string },
    limit: number,
    offset: number
  ): Promise<CourseWithUniversity[]>;
  getCourseById(id: number): Promise<CourseWithUniversity | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Counselor operations
  getCounselors(): Promise<Counselor[]>;
  createCounselor(counselor: InsertCounselor): Promise<Counselor>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<FavoriteWithCourse[]>;
  addToFavorites(userId: string, courseId: number): Promise<Favorite>;
  removeFromFavorites(userId: string, courseId: number): Promise<void>;
  isFavorite(userId: string, courseId: number): Promise<boolean>;

  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getUserApplications(userId: string): Promise<any[]>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>; // ✅ added here

  // Tutorial operations
  getTutorials(): Promise<Tutorial[]>;
  createTutorial(tutorial: InsertTutorial): Promise<Tutorial>;

  // Admin operations
  getUsers(): Promise<User[]>;
  getAllApplications(): Promise<Application[]>;
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

  async getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result.length;
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