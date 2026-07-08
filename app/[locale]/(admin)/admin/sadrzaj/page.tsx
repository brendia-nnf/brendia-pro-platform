"use client";

import { Container } from "@/components/ui";
import { CourseEditor } from "@/components/admin";

export default function AdminContentPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Sadržaj tečaja
        </h1>
        <p className="text-gray-600 mt-1">
          Upravljajte razinama i poglavljima tečaja.
        </p>
      </div>

      <CourseEditor />
    </Container>
  );
}
