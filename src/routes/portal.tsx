import { For } from "solid-js";
import { unstable_clientOnly, useLocation, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { CourseService } from "~/lib/course-service";
import styles from "./portal.module.css";
import { decodeHoleData } from "~/utils/url-utils";

const CollisionDisplay = unstable_clientOnly(
  () => import("~/components/CollisionDisplay")
);

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
                <a href={`/play/${course._id}`}>
                  <div class={styles.svgWrapper}>
                    <svg
                      viewBox={`0 0 ${data.dimensions.x} ${data.dimensions.y}`}
                    >
                      <CollisionDisplay
                        objects={data.collisionObjects}
                        stageDimensions={data.dimensions}
                        startPos={data.startPos}
                      />
                    </svg>
                  </div>
                  <span>{course.name}</span>
                </a>
              </li>
            );
          }}
        </For>
      </ul>
    </main>
  );
}
