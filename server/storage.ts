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
import { eq, and, desc, ilike, inArray, gte, asc, sql } from "drizzle-orm";
import { sql, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getUniversities(): Promise<University[]>;
  createUniversity(university: InsertUniversity): Promise<University>;

  getCourses(filters?: { search?: string; faculty?: string; level?: string; ieltsScore?: string }): Promise<CourseWithUniversity[]>;
  getCoursesPaginated(
    filters: { search?: string; faculty?: string; level?: string; ieltsScore?: string },
    limit: number,
    offset: number
  ): Promise<CourseWithUniversity[]>;
  getCourseById(id: number): Promise<CourseWithUniversity | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  getDistinctFaculties(): Promise<string[]>;
  getDistinctLevels(): Promise<string[]>;
  getDistinctIeltsScores(): Promise<string[]>;

  getCounselors(): Promise<Counselor[]>;
  createCounselor(counselor: InsertCounselor): Promise<Counselor>;

  getUserFavorites(userId: string): Promise<FavoriteWithCourse[]>;
  addToFavorites(userId: string, courseId: number): Promise<Favorite>;
  removeFromFavorites(userId: string, courseId: number): Promise<void>;
  isFavorite(userId: string, courseId: number): Promise<boolean>;

  createApplication(application: InsertApplication): Promise<Application>;
  getUserApplications(userId: string): Promise<any[]>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;

  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  getTutorials(): Promise<Tutorial[]>;
  createTutorial(tutorial: InsertTutorial): Promise<Tutorial>;

  getUsers(): Promise<User[]>;
  getAllApplications(): Promise<Application[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error: any) {
      if (error.code === '23505') {
        const [user] = await db
          .update(users)
          .set({
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return user;
      }
      throw error;
    }
  }

  async getUniversities(): Promise<University[]> {
    return await db.select().from(universities);
  }

  async createUniversity(university: InsertUniversity): Promise<University> {
    const [created] = await db.insert(universities).values(university).returning();
    return created;
  }

  async getCourses(filters?: { search?: string; faculty?: string; level?: string; ieltsScore?: string }): Promise<CourseWithUniversity[]> {
    let query = db
      .select()
      .from(courses)
      .leftJoin(universities, eq(courses.universityId, universities.id));

    const conditions = [];

    if (filters?.search) {
      conditions.push(ilike(courses.name, `%${filters.search}%`));
    }

    if (filters?.faculty && filters.faculty !== "All Faculties") {
      conditions.push(eq(courses.faculty, filters.faculty));
    }

    if (filters?.level && filters.level !== "All Levels") {
      conditions.push(eq(courses.level, filters.level));
    }

    if (filters?.ieltsScore && filters.ieltsScore !== "All IELTS Scores") {
      const numericScore = parseFloat(filters.ieltsScore);
      conditions.push(eq(courses.ieltsOverall, numericScore.toString()));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;

    return result.map((row) => ({
      ...row.courses,
      university: row.universities!,
    }));
  }

  async getCoursesPaginated(
    filters: { search?: string; faculty?: string; level?: string; ieltsScore?: string },
    limit: number,
    offset: number
  ): Promise<CourseWithUniversity[]> {
    let query = db
      .select()
      .from(courses)
      .leftJoin(universities, eq(courses.universityId, universities.id));

    const conditions = [];

    if (filters?.search) {
      conditions.push(ilike(courses.name, `%${filters.search}%`));
    }

    if (filters?.faculty && filters.faculty !== "All Faculties") {
      conditions.push(eq(courses.faculty, filters.faculty));
    }

    if (filters?.level && filters.level !== "All Levels") {
      conditions.push(eq(courses.level, filters.level));
    }

    if (filters?.ieltsScore && filters.ieltsScore !== "All IELTS Scores") {
      const numericScore = parseFloat(filters.ieltsScore);
      conditions.push(eq(courses.ieltsOverall, numericScore.toString()));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.limit(limit).offset(offset);

    const result = await query;

    return result.map((row) => ({
      ...row.courses,
      university: row.universities!,
    }));
  }

  async getCourseById(id: number): Promise<CourseWithUniversity | undefined> {
    const [result] = await db
      .select()
      .from(courses)
      .leftJoin(universities, eq(courses.universityId, universities.id))
      .where(eq(courses.id, id));

    if (!result) return undefined;

    return {
      ...result.courses,
      university: result.universities!,
    };
  }

  async getDistinctFaculties(): Promise<string[]> {
    const result = await db
      .selectDistinct({ faculty: courses.faculty })
      .from(courses)
      .orderBy(asc(courses.faculty));
    return result.map((r) => r.faculty).filter(Boolean);
  }

  async getDistinctLevels(): Promise<string[]> {
    const result = await db
      .selectDistinct({ level: courses.level })
      .from(courses)
      .orderBy(asc(courses.level));
    return result.map((r) => r.level).filter(Boolean);
  }

  async getDistinctIeltsScores(): Promise<string[]> {
    const result = await db
      .selectDistinct({ ieltsOverall: courses.ieltsOverall })
      .from(courses)
      .orderBy(asc(courses.ieltsOverall));
    return result.map((r) => r.ieltsOverall?.toString()).filter(Boolean);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  async getCounselors(): Promise<Counselor[]> {
    return await db.select().from(counselors).where(eq(counselors.isActive, true));
  }

  async createCounselor(counselor: InsertCounselor): Promise<Counselor> {
    const [created] = await db.insert(counselors).values(counselor).returning();
    return created;
  }

  async getUserFavorites(userId: string): Promise<FavoriteWithCourse[]> {
    const favoriteList = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));

    const result = [];
    for (const favorite of favoriteList) {
      const courseWithUniversity = await this.getCourseById(favorite.courseId);
      if (courseWithUniversity) {
        result.push({
          ...favorite,
          course: courseWithUniversity,
        });
      }
    }

    return result;
  }

  async addToFavorites(userId: string, courseId: number): Promise<Favorite> {
    const [created] = await db.insert(favorites).values({ userId, courseId }).returning();
    return created;
  }

  async removeFromFavorites(userId: string, courseId: number): Promise<void> {
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.courseId, courseId)));
  }

  async isFavorite(userId: string, courseId: number): Promise<boolean> {
    const result = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.courseId, courseId)))
      .limit(1);
    return result.length > 0;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values(application).returning();
    return created;
  }

  async getUserApplications(userId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));

    const applicationsWithCourses = await Promise.all(
      result.map(async (app) => {
        if (app.selectedCourses && app.selectedCourses.length > 0) {
          const courseDetails = await db
            .select({
              id: courses.id,
              name: courses.name,
              universityName: universities.name,
            })
            .from(courses)
            .leftJoin(universities, eq(courses.universityId, universities.id))
            .where(inArray(courses.id, app.selectedCourses));

          return {
            ...app,
            courseDetails,
          };
        }

        return {
          ...app,
          courseDetails: [],
        };
      })
    );

    return applicationsWithCourses;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const [updated] = await db
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

async getTutorials(): Promise<Tutorial[]> {
  try {
    return await db
      .select()
      .from(tutorials)
      .where(eq(tutorials.isActive, true))
      .orderBy(
        sql`${tutorials.category_order} ASC`,
        sql`${tutorials.order} ASC`
      );
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    throw new Error("Failed to fetch tutorials");
  }
}

  async createTutorial(tutorial: InsertTutorial): Promise<Tutorial> {
    const [created] = await db.insert(tutorials).values(tutorial).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications).orderBy(desc(applications.createdAt));
  }
}

export const storage = new DatabaseStorage();
