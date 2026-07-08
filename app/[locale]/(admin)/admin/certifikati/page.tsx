"use client";

import { Container, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { CertificationQueue } from "@/components/admin";

export default function AdminCertificationsPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Certifikati
        </h1>
        <p className="text-gray-600 mt-1">
          Pregledajte i odobrite prijave za certifikaciju.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Na čekanju</TabsTrigger>
          <TabsTrigger value="approved">Odobreni</TabsTrigger>
          <TabsTrigger value="rejected">Odbijeni</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <CertificationQueue />
        </TabsContent>

        <TabsContent value="approved">
          <div className="text-center py-8 text-gray-500">
            Odobreni certifikati će se prikazati ovdje.
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="text-center py-8 text-gray-500">
            Odbijene prijave će se prikazati ovdje.
          </div>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
