export interface Course {
  _id: string;
  name: string;
  data: string;
}

export interface NewCourse extends Omit<Course, "_id"> {}
