import { Title, useLocation } from "solid-start";

export default function Edit() {
  const location = useLocation();
  const encodedCollision = location.query["data"];
  return (
    <main>
      <Title>Edit</Title>
      {location.pathname} {location.search}
    </main>
  );
}
