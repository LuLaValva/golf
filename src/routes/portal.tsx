import { For } from "solid-js";
import { useLocation, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { CourseService } from "~/lib/course-service";
import styles from "./portal.module.css";
import { A } from "@solidjs/router";
import { decodeHoleData } from "~/utils/url-utils";
import CollisionDisplay from "~/components/CollisionDisplay";

export function routeData() {
  return createServerData$(async () => {
    const filter = new URLSearchParams(useLocation().search).get("filter");
    return await CourseService.getInstance().getCourses(filter ?? undefined);
  });
}

export default function Portal() {
  const courses = useRouteData<typeof routeData>();

  return (
    <main class={styles.main}>
      <form class={styles.searchArea}>
        <input type="text" placeholder="Filter..." name="filter" />
        <button type="submit">Filter</button>
      </form>
      <ul class={styles.courseList}>
        <For each={courses()}>
          {(course) => {
            const data = decodeHoleData(course.data);
            return (
              <li>
                <A href={`/play?data=${course.data}`}>
                  <svg
                    viewBox={`0 0 ${data.dimensions.x} ${data.dimensions.y}`}
                  >
                    <CollisionDisplay objects={data.collisionObjects} />
                  </svg>
                  <span>{course.name}</span>
                </A>
              </li>
            );
          }}
        </For>
      </ul>
    </main>
  );
}
