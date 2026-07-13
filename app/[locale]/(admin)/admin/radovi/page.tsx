"use client";

import { Container, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { PhotoReviewQueue } from "@/components/admin";

export default function AdminPhotoSubmissionsPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Radovi studenata
        </h1>
        <p className="text-gray-600 mt-1">
          Pregledajte fotografije radova i odobrite ih ili zatražite doradu.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Na čekanju</TabsTrigger>
          <TabsTrigger value="approved">Odobreni</TabsTrigger>
          <TabsTrigger value="redo_requested">Dorade</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PhotoReviewQueue status="pending" />
        </TabsContent>

        <TabsContent value="approved">
          <PhotoReviewQueue status="approved" />
        </TabsContent>

        <TabsContent value="redo_requested">
          <PhotoReviewQueue status="redo_requested" />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
