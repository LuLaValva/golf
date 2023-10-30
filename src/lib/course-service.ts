import { Db, ObjectId } from "mongodb";
import { NewCourse, Course } from "../models/course";
import { Database } from "./database";

const COLLECTION = "courses";

export class CourseService {
  db: Db;
  private static instance: CourseService;

  private constructor() {
    this.db = Database.getInstance().getDb();
  }

  public static getInstance() {
    if (!CourseService.instance) {
      CourseService.instance = new CourseService();
    }

    return CourseService.instance;
  }

  async getCourses(filter?: string, limit = 50, page = 0): Promise<Course[]> {
    const itemsFromDb = await this.db
      .collection(COLLECTION)
      .find(filter ? { name: { $regex: filter, $options: "i" } } : {})
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray();
    return itemsFromDb.map((details) => ({
      ...details,
      _id: details._id.toString(),
    })) as Course[];
  }

  async addCourse(course: NewCourse) {
    await this.db.collection(COLLECTION).insertOne(course);
  }

  async deleteCourse(id: string) {
    await this.db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  }
}
