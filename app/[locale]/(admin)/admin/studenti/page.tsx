"use client";

import { Container } from "@/components/ui";
import { StudentTable } from "@/components/admin";

export default function AdminStudentsPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Studenti
        </h1>
        <p className="text-gray-600 mt-1">
          Upravljajte studentima i njihovim pristupom.
        </p>
      </div>

      <StudentTable />
    </Container>
  );
}
